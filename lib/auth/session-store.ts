<<<<<<< HEAD
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
=======
import type { User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'
import { verifyPassword } from './password'

export type AuthProvider = 'credentials' | 'google' | 'microsoft'

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_exists'
  | 'provider_mismatch'
  | 'account_not_found'

interface AuthAccount {
  email: string
  userId: string
  provider: AuthProvider
  password?: string
}

export interface SessionRecord {
  token: string
  userId: string
  provider: AuthProvider
  createdAt: number
  updatedAt: number
  expiresAt: number
}

interface IdentityRecord {
  userId: string
  email: string
  provider: 'credentials'
  passwordHash: string
  createdAt: number
}

interface RegisterCredentialsInput {
  email: string
  name?: string
  passwordHash: string
}

const sessions = new Map<string, SessionRecord>()
const credentialIdentities = new Map<string, IdentityRecord>()
export const SESSION_TTL_SECONDS = 60 * 60 * 8
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000

export function createSession(email: string, provider: AuthProvider): SessionRecord | null {
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return null
  return createSessionForUserId(user.id, provider)
}

export function createSessionForUserId(userId: string, provider: AuthProvider = 'credentials'): SessionRecord {
  const token = randomUUID()
  const now = Date.now()

  const session: SessionRecord = {
    token,
    userId,
    provider,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }
}

export function createSession(email: string, provider: AuthProvider): SessionRecord | null {
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const session = createSessionRecord(user.id, provider)
  sessions.set(session.token, session)
  return session
}

export function registerCredentialsAccount(input: RegisterCredentialsInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const existingUser = appDataStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
  const existingIdentity = credentialIdentities.get(normalizedEmail)
  if (existingUser || existingIdentity) {
    return { error: 'duplicate' as const }
  }

  const user: User = {
    id: generateId('user'),
    email: normalizedEmail,
    name: input.name?.trim() || 'New User',
    role: 'member',
    createdAt: new Date().toISOString(),
  }

  const identity: IdentityRecord = {
    userId: user.id,
    email: normalizedEmail,
    provider: 'credentials',
    passwordHash: input.passwordHash,
    createdAt: Date.now(),
  }

  const session = createSessionForUserId(user.id, 'credentials')

  appDataStore.users.push(user)
  credentialIdentities.set(normalizedEmail, identity)

  return { user, session }
}

export async function authenticateWithCredentials(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim()
  const identity = credentialIdentities.get(normalizedEmail)
  if (!identity) return null

  const isValidPassword = await verifyPassword(password, identity.passwordHash)
  if (!isValidPassword) return null

  return appDataStore.users.find((u) => u.id === identity.userId) ?? null
}

export function revokeSession(token: string) {
  sessions.delete(token)
}

export function revokeAllUserSessions(userId: string) {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token)
    }
  }
}

export function getSessionByToken(token: string | undefined): SessionRecord | null {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export function resolveUserSession(token: string | undefined): SessionResolution {
  const session = getSessionByToken(token)
  if (!session) return { user: null, session: null }

  const user = appDataStore.users.find((u) => u.id === session.userId) ?? null
  if (!user) {
    sessions.delete(session.token)
    return { user: null, session: null }
  }

  const now = Date.now()
  if (now - session.updatedAt >= SESSION_REFRESH_MS) {
    const rotated = createSessionRecord(session.userId, session.provider)
    sessions.delete(session.token)
    sessions.set(rotated.token, rotated)
    return { user, session: rotated, rotatedToken: rotated.token }
  }

  session.updatedAt = now
  session.expiresAt = now + SESSION_TTL_MS
  return { user, session }
}

export function getUserForSession(token: string | undefined): User | null {
  return resolveUserSession(token).user
}

export function rotateSessionsForPrivilegeChange(userId: string) {
  const userSessions = [...sessions.values()].filter((session) => session.userId === userId)
  for (const session of userSessions) {
    sessions.delete(session.token)
    const rotated = createSessionRecord(userId, session.provider)
    sessions.set(rotated.token, rotated)
  }
}

export function clearAuthStateForTests() {
  sessions.clear()
>>>>>>> main
}
