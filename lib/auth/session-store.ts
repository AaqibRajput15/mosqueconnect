import { randomUUID } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'
import { verifyPassword } from './password'

export type AuthProvider = 'credentials'

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_exists'
  | 'provider_mismatch'
  | 'account_not_found'

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

interface SessionResolution {
  user: User | null
  session: SessionRecord | null
  rotatedToken?: string
}

const sessions = new Map<string, SessionRecord>()
const credentialIdentities = new Map<string, IdentityRecord>()
export const SESSION_TTL_SECONDS = 60 * 60 * 8
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000
const SESSION_REFRESH_MS = 1000 * 60 * 30
const SEEDED_PASSWORD_HASH =
  'scrypt$32768$8$1$dcf95ef3274d2eb00873c0563186189d$a6ef3751c2d8fac2a5230bf5bb388cbfb57323b14c750d70170053bacc53838e3d1539f91b718368adc68c521f51595e31ec5b67fcacc7e62b83aaec5347a92a'

function seedCredentialIdentityIfMissing(user: User) {
  const normalizedEmail = user.email.toLowerCase().trim()
  if (credentialIdentities.has(normalizedEmail)) return

  credentialIdentities.set(normalizedEmail, {
    userId: user.id,
    email: normalizedEmail,
    provider: 'credentials',
    passwordHash: SEEDED_PASSWORD_HASH,
    createdAt: Date.now(),
  })
}

for (const user of appDataStore.users) {
  if (user.email) {
    seedCredentialIdentityIfMissing(user)
  }
}

function createSessionRecord(userId: string, provider: AuthProvider): SessionRecord {
  const token = randomUUID()
  const now = Date.now()
  return {
    token,
    userId,
    provider,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }
}

export function createSession(email: string, provider: AuthProvider): SessionRecord | null {
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  if (!user) return null
  return createSessionForUserId(user.id, provider)
}

export function createSessionForUserId(userId: string, provider: AuthProvider = 'credentials'): SessionRecord {
  const session = createSessionRecord(userId, provider)
  sessions.set(session.token, session)
  return session
}

export function createUser(email: string, name?: string): User {
  const normalizedEmail = email.toLowerCase().trim()
  const existing = appDataStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (existing) return existing

  const user: User = {
    id: generateId('user'),
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail,
    role: 'member',
    createdAt: new Date().toISOString(),
    emailVerified: true,
  }

  appDataStore.users.push(user)
  return user
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

export function rotateSessionsForPrivilegeChange(userId: string) {
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

export function clearAuthStateForTests() {
  sessions.clear()
}
