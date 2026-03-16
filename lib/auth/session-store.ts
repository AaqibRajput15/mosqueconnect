import { randomUUID } from 'crypto'
import type { User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'

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
  expiresAt: number
}

const sessions = new Map<string, SessionRecord>()
const SESSION_TTL_MS = 1000 * 60 * 60 * 8

const accounts = new Map<string, AuthAccount>([
  [
    'admin@mosqueconnect.org',
    {
      email: 'admin@mosqueconnect.org',
      userId: 'user-1',
      provider: 'credentials',
      password: 'password123',
    },
  ],
  [
    'imam@alnoor.org',
    {
      email: 'imam@alnoor.org',
      userId: 'user-2',
      provider: 'google',
    },
  ],
  [
    'member@example.org',
    {
      email: 'member@example.org',
      userId: 'user-3',
      provider: 'microsoft',
    },
  ],
  [
    'shura@mosqueconnect.org',
    {
      email: 'shura@mosqueconnect.org',
      userId: 'user-4',
      provider: 'credentials',
      password: 'password123',
    },
  ],
])

function createSessionForUser(userId: string, provider: AuthProvider): SessionRecord {
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

export function signInWithCredentials(email: string, password: string): { session?: SessionRecord; errorCode?: AuthErrorCode } {
  const normalizedEmail = email.trim().toLowerCase()
  const account = accounts.get(normalizedEmail)

  if (!account) return { errorCode: 'invalid_credentials' }
  if (account.provider !== 'credentials') return { errorCode: 'provider_mismatch' }
  if (!account.password || account.password !== password) return { errorCode: 'invalid_credentials' }

  return { session: createSessionForUser(account.userId, account.provider) }
}

export function registerWithCredentials(
  email: string,
  password: string,
): { session?: SessionRecord; errorCode?: AuthErrorCode } {
  const normalizedEmail = email.trim().toLowerCase()
  const existingAccount = accounts.get(normalizedEmail)

  if (existingAccount?.provider === 'credentials') return { errorCode: 'account_exists' }
  if (existingAccount) return { errorCode: 'provider_mismatch' }

  const userId = generateId('user')
  const now = new Date().toISOString()
  const newUser: User = {
    id: userId,
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0] ?? 'New User',
    role: 'member',
    createdAt: now,
  }

  appDataStore.users.push(newUser)
  accounts.set(normalizedEmail, {
    email: normalizedEmail,
    userId,
    provider: 'credentials',
    password,
  })

  return { session: createSessionForUser(userId, 'credentials') }
}

export function startOAuth(
  email: string,
  provider: AuthProvider,
  intent: 'sign-in' | 'sign-up',
): { session?: SessionRecord; errorCode?: AuthErrorCode } {
  const normalizedEmail = email.trim().toLowerCase()
  const existingAccount = accounts.get(normalizedEmail)

  if (intent === 'sign-in') {
    if (!existingAccount) return { errorCode: 'account_not_found' }
    if (existingAccount.provider !== provider) return { errorCode: 'provider_mismatch' }
    return { session: createSessionForUser(existingAccount.userId, provider) }
  }

  if (existingAccount?.provider === provider) return { errorCode: 'account_exists' }
  if (existingAccount) return { errorCode: 'provider_mismatch' }

  const userId = generateId('user')
  const now = new Date().toISOString()
  const newUser: User = {
    id: userId,
    email: normalizedEmail,
    name: normalizedEmail.split('@')[0] ?? 'New User',
    role: 'member',
    createdAt: now,
  }

  appDataStore.users.push(newUser)
  accounts.set(normalizedEmail, {
    email: normalizedEmail,
    userId,
    provider,
  })

  return { session: createSessionForUser(userId, provider) }
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
