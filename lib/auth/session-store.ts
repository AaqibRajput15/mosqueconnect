import { randomUUID } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'

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
  return createSessionForUserId(user.id, provider)
}


export function createSessionForUserId(userId: string, provider: AuthProvider): SessionRecord | null {
  const user = appDataStore.users.find((candidate) => candidate.id === userId)
  if (!user) return null

  const token = randomUUID()
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
