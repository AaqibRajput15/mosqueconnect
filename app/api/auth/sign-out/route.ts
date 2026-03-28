import { NextResponse } from 'next/server'
import { clearAuthCookie, deserializeSessionCookie } from '@/lib/auth/cookies'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { revokeSession } from '@/lib/auth/session-store'
import { revokeSupabaseSession } from '@/lib/auth/supabase-auth'

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

  let allSessions = false
  try {
    const payload = (await request.json()) as { allSessions?: boolean }
    allSessions = payload.allSessions === true
  } catch {
    allSessions = false
  }

  const token = readSessionToken(request)
  if (token) revokeSession(token)
  const session = deserializeSessionCookie(token)
  if (session) {
    await revokeSupabaseSession(session.accessToken, allSessions)
  }

  const response = NextResponse.json({ ok: true, user: null })
  clearAuthCookie(response)
  return response
}
