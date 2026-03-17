import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth/cookies'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { revokeSession } from '@/lib/auth/session-store'

function readSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get('cookie') ?? ''
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]
}

export async function POST(request: Request) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const token = readSessionToken(request)
  if (token) revokeSession(token)

  const response = NextResponse.json({ ok: true, user: null })
  clearAuthCookie(response)
  return response
}
