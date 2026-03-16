import { cookies } from 'next/headers'

import type { User, UserRole } from '@/lib/types'
import { sessionStore, type SessionContext } from './session-store'

export const SESSION_COOKIE_NAME = 'mc_session'

export class ApiAuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function parseCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null
  const entries = cookieHeader.split(';').map((v) => v.trim())
  for (const entry of entries) {
    if (entry.startsWith(`${key}=`)) return decodeURIComponent(entry.slice(key.length + 1))
  }
  return null
}

async function getCookieToken(request?: Request): Promise<string | null> {
  if (request) {
    return parseCookieValue(request.headers.get('cookie'), SESSION_COOKIE_NAME)
  }

  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function createSignInSession(
  user: User,
  provider: string,
  rawSessionToken: string,
  context: SessionContext = {},
) {
  return sessionStore.createSession(user.id, provider, rawSessionToken, context)
}

export async function getSessionUser(request?: Request): Promise<User | null> {
  const token = await getCookieToken(request)
  if (!token) return null
  return sessionStore.resolveSessionUser(token)
}

export async function signOutSession(request?: Request) {
  const token = await getCookieToken(request)
  if (!token) return null
  return sessionStore.revokeSession(token)
}

export async function requireApiPermission(request: Request, allowedRoles: UserRole | UserRole[]): Promise<User> {
  const sessionUser = await getSessionUser(request)
  if (!sessionUser) throw new ApiAuthError(401, 'Unauthorized')

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!roles.includes(sessionUser.role)) {
    throw new ApiAuthError(403, 'Forbidden')
  }

  return sessionUser
}

export async function cleanupExpiredSessions() {
  return sessionStore.cleanupExpiredSessions()
}
