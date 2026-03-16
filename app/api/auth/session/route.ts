import { NextResponse } from 'next/server'
import { parseCookies } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { resolveUserSession } from '@/lib/auth/session-store'
import { setAuthCookie } from '@/lib/auth/cookies'

export async function GET(request: Request) {
  const token = parseCookies(request)[AUTH_COOKIE]
  const resolved = resolveUserSession(token)
  if (!resolved.user) return NextResponse.json({ user: null })

  const response = NextResponse.json({ user: resolved.user })
  if (resolved.rotatedToken) {
    setAuthCookie(response, resolved.rotatedToken)
  }
  return response
}
