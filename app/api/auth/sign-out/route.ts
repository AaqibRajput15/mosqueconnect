import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth/cookies'
import { parseCookies, validateCsrfToken } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { getSessionByToken, revokeAllUserSessions, revokeSession } from '@/lib/auth/session-store'

export async function POST(request: Request) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const allSessions = Boolean(body.allSessions)
  const token = parseCookies(request)[AUTH_COOKIE]

  if (token) {
    if (allSessions) {
      const session = getSessionByToken(token)
      if (session) revokeAllUserSessions(session.userId)
    } else {
      revokeSession(token)
    }
  }

  const response = NextResponse.json({ ok: true })
  clearAuthCookie(response)
  return response
}
