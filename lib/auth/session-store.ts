import { createHmac, timingSafeEqual } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'

export type AuthProvider = 'credentials' | 'google' | 'microsoft'

interface SessionPayload {
  userId: string
  provider: AuthProvider
  iat: number
  exp: number
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 8
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET ?? 'dev-only-change-me'

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(payload: string) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function createSessionToken(email: string, provider: AuthProvider): string | null {
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const now = Date.now()
  const payload: SessionPayload = {
    userId: user.id,
    provider,
    iat: now,
    exp: now + SESSION_TTL_MS,
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expected = sign(encodedPayload)
  if (!safeEqual(signature, expected)) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getUserForSession(token: string | undefined): User | null {
  const payload = parseSessionToken(token)
  if (!payload) return null
  return appDataStore.users.find((u) => u.id === payload.userId) ?? null
}
