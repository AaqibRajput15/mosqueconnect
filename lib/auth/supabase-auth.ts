import { backendConfig } from '@/lib/backend/config'

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const SUPABASE_AUTH_PATH = '/auth/v1'

export interface SupabaseAuthUser {
  id: string
  email?: string
  factors?: Array<{ factor_type?: string; status?: string }>
}

export interface SupabaseAuthSession {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
  tokenType: string
  user: SupabaseAuthUser
}

function getSupabaseAuthUrl(path: string) {
  const baseUrl = backendConfig.supabaseUrl?.trim()
  if (!baseUrl) return null
  return `${baseUrl}${SUPABASE_AUTH_PATH}${path}`
}

function getSupabaseApiKey() {
  return SUPABASE_ANON_KEY ?? backendConfig.serviceRoleKey?.trim() ?? null
}

function hasAuthConfig() {
  return Boolean(getSupabaseAuthUrl('') && getSupabaseApiKey())
}

function parseAuthSession(payload: Record<string, unknown>): SupabaseAuthSession | null {
  const accessToken = typeof payload.access_token === 'string' ? payload.access_token : null
  const refreshToken = typeof payload.refresh_token === 'string' ? payload.refresh_token : null
  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : null
  const tokenType = typeof payload.token_type === 'string' ? payload.token_type : 'bearer'
  const user = typeof payload.user === 'object' && payload.user ? (payload.user as SupabaseAuthUser) : null
  if (!accessToken || !refreshToken || !expiresIn || !user?.id) return null

  return {
    accessToken,
    refreshToken,
    expiresIn,
    expiresAt: Date.now() + expiresIn * 1000,
    tokenType,
    user,
  }
}

async function requestSupabaseAuth(path: string, init?: RequestInit) {
  const url = getSupabaseAuthUrl(path)
  const apiKey = getSupabaseApiKey()
  if (!url || !apiKey) return null

  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  return response
}

export function isSupabaseAuthEnabled() {
  return hasAuthConfig()
}

export async function signInWithSupabasePassword(email: string, password: string): Promise<SupabaseAuthSession | null> {
  const response = await requestSupabaseAuth('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (!response?.ok) return null
  const payload = (await response.json()) as Record<string, unknown>
  return parseAuthSession(payload)
}

export async function signUpWithSupabasePassword(email: string, password: string, metadata?: Record<string, string>) {
  const response = await requestSupabaseAuth('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data: metadata }),
  })

  if (!response?.ok) return null
  const payload = (await response.json()) as Record<string, unknown>
  return parseAuthSession(payload)
}

export async function refreshSupabaseSession(refreshToken: string): Promise<SupabaseAuthSession | null> {
  const response = await requestSupabaseAuth('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response?.ok) return null
  const payload = (await response.json()) as Record<string, unknown>
  return parseAuthSession(payload)
}

export async function getSupabaseUserFromAccessToken(accessToken: string): Promise<SupabaseAuthUser | null> {
  const response = await requestSupabaseAuth('/user', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response?.ok) return null
  return (await response.json()) as SupabaseAuthUser
}

export async function revokeSupabaseSession(accessToken: string, allSessions = false) {
  const response = await requestSupabaseAuth('/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ scope: allSessions ? 'global' : 'local' }),
  })

  return Boolean(response?.ok)
}
