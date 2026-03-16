import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { AUTH_COOKIE } from '@/lib/auth/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
=======
import { clearAuthCookie } from '@/lib/auth/cookies'
import { parseCookies, validateCsrfToken } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { getUserForSession, revokeSession } from '@/lib/auth/session-store'
import { buildAuditContext, logAudit } from '@/lib/auth/audit-log'

export async function POST(request: Request) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  if (token) {
    revokeSession(token)
  }

  const response = NextResponse.json({ ok: true, user: null })
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

>>>>>>> main
  return response
}
