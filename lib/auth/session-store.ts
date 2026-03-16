import { randomUUID } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'

export type AuthProvider = 'credentials' | 'google' | 'microsoft'

export interface SessionRecord {
  token: string
  userId: string
  provider: AuthProvider
  createdAt: number
  updatedAt: number
  expiresAt: number
}

export interface SessionResolution {
  user: User | null
  session: SessionRecord | null
  rotatedToken?: string
}

const sessions = new Map<string, SessionRecord>()
const SESSION_TTL_MS = 1000 * 60 * 60 * 8
const SESSION_REFRESH_MS = 1000 * 60 * 30

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
  const user = appDataStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return null

  const session = createSessionRecord(user.id, provider)
  sessions.set(session.token, session)
  return session
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
