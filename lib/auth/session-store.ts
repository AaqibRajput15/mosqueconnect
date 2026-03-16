import { randomUUID } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'
import { verifyPassword } from './password'

export type AuthProvider = 'credentials' | 'google' | 'microsoft'

export interface SessionRecord {
  token: string
  userId: string
  provider: AuthProvider
  createdAt: number
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
    expiresAt: now + SESSION_TTL_MS,
  }

  sessions.set(token, session)
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

export function getUserForSession(token: string | undefined): User | null {
  if (!token) return null
  const session = sessions.get(token)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }

  return appDataStore.users.find((u) => u.id === session.userId) ?? null
}
