import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import type { UserRole } from '@/lib/types'

export type OAuthProvider = 'google' | 'microsoft'

export interface OAuthProviderConfig {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  authorizationEndpoint: string
  tokenEndpoint: string
  issuer?: string
  jwksUri: string
  redirectUri: string
  scope: string
  userInfoEndpoint?: string
}

export interface OAuthClaims {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  iss?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
}

export const OAUTH_COOKIE = 'mc_oauth_state'

const required = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function buildRedirectUri(path: string) {
  const configured = process.env.OAUTH_CALLBACK_BASE_URL
  if (required(configured)) {
    return new URL(path, configured).toString()
  }

  return new URL(path, getAppUrl()).toString()
}

export function getOAuthProviderConfig(provider: OAuthProvider): OAuthProviderConfig | null {
  if (provider === 'google') {
    if (!required(process.env.GOOGLE_CLIENT_ID) || !required(process.env.GOOGLE_CLIENT_SECRET)) return null
    return {
      provider,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      issuer: 'https://accounts.google.com',
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
      redirectUri: buildRedirectUri('/api/auth/oauth/google/callback'),
      scope: 'openid email profile',
    }
  }

  if (!required(process.env.MICROSOFT_CLIENT_ID) || !required(process.env.MICROSOFT_CLIENT_SECRET) || !required(process.env.MICROSOFT_TENANT_ID)) {
    return null
  }

  const tenant = process.env.MICROSOFT_TENANT_ID as string
  return {
    provider,
    clientId: process.env.MICROSOFT_CLIENT_ID as string,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
    jwksUri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`,
    redirectUri: buildRedirectUri('/api/auth/oauth/microsoft/callback'),
    scope: 'openid email profile',
  }
}

export interface OAuthStartState {
  provider: OAuthProvider
  nonce: string
  state: string
  verifier: string
  redirectTo: string
  createdAt: number
}

export function createPkceVerifier() {
  return randomBytes(64).toString('base64url')
}

export function createPkceChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function createNonce() {
  return randomBytes(16).toString('hex')
}

function stateCookieName(provider: OAuthProvider) {
  return `${OAUTH_COOKIE}_${provider}`
}

export async function storeOAuthState(payload: OAuthStartState) {
  const jar = await cookies()
  jar.set(stateCookieName(payload.provider), Buffer.from(JSON.stringify(payload)).toString('base64url'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
}

export async function consumeOAuthState(provider: OAuthProvider): Promise<OAuthStartState | null> {
  const jar = await cookies()
  const raw = jar.get(stateCookieName(provider))?.value
  jar.delete(stateCookieName(provider))
  if (!raw) return null

  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as OAuthStartState
  } catch {
    return null
  }
}

export async function exchangeCodeForTokens(config: OAuthProviderConfig, code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code,
    code_verifier: verifier,
  })

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Unable to exchange authorization code.')
  }

  return response.json() as Promise<{ id_token?: string }>
}

function decodeJwtPart(part: string) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf-8')) as Record<string, unknown>
}


async function importJwk(jwk: JsonWebKey, alg: string) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: alg === 'RS384' ? 'SHA-384' : 'SHA-256' }, false, ['verify'])
}

export async function verifyIdToken(config: OAuthProviderConfig, idToken: string, expectedNonce: string): Promise<OAuthClaims> {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid ID token format.')
  }

  const header = decodeJwtPart(encodedHeader) as { kid?: string; alg?: string }
  const payload = decodeJwtPart(encodedPayload) as unknown as OAuthClaims & { nonce?: string }

  const jwksResponse = await fetch(config.jwksUri, { cache: 'no-store' })
  if (!jwksResponse.ok) throw new Error('Failed to fetch JWKS.')
  const jwks = (await jwksResponse.json()) as { keys: Array<JsonWebKey & { kid?: string; x5c?: string[]; alg?: string }> }

  const keyData = jwks.keys.find((key) => key.kid === header.kid) ?? jwks.keys[0]
  if (!keyData) throw new Error('No key available for ID token verification.')

  const key = await importJwk(keyData, header.alg ?? keyData.alg ?? 'RS256')

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    Buffer.from(encodedSignature, 'base64url'),
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
  )

  if (!isValid) throw new Error('Invalid ID token signature.')

  if (payload.nonce !== expectedNonce) throw new Error('Nonce mismatch.')

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) throw new Error('Expired ID token.')
  if (payload.nbf && payload.nbf > now) throw new Error('ID token not yet valid.')

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audience.includes(config.clientId)) throw new Error('Invalid ID token audience.')

  if (config.issuer && payload.iss && payload.iss !== config.issuer) {
    throw new Error('Unexpected ID token issuer.')
  }

  return payload
}

export function getRoleRedirect(role: UserRole) {
  if (role === 'admin') return '/admin'
  if (role === 'shura') return '/shura'
  return '/feed'
}
