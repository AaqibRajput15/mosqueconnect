import { NextResponse } from 'next/server'
import { parseCookies } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { resolveUserSession } from '@/lib/auth/session-store'
import { setAuthCookie } from '@/lib/auth/cookies'

export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json({ ok: true, user: user ?? null })
}
