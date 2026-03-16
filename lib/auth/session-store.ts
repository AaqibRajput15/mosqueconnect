import type { User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'
import { createAuthToken } from './utils'

export type AuthProvider = 'credentials' | 'google' | 'microsoft'

export interface SessionRecord {
  token: string
  userId: string
  provider: AuthProvider
  createdAt: number
  expiresAt: number
}

const sessions = new Map<string, SessionRecord>()
const SESSION_TTL_MS = 1000 * 60 * 60 * 8

export function createSession(email: string, provider: AuthProvider): SessionRecord | null {
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const token = createAuthToken()
  const now = Date.now()
  const session: SessionRecord = {
    token,
    userId: user.id,
    provider,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  }

  sessions.set(token, session)
  return session
}

export function createUser(email: string, name: string): User {
  const existing = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) return existing

  const user: User = {
    id: generateId('user'),
    email,
    name,
    role: 'member',
    createdAt: new Date().toISOString(),
  }
  appDataStore.users.push(user)
  return user
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

export function clearAuthStateForTests() {
  sessions.clear()
}
