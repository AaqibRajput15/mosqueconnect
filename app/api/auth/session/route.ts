import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { getSessionUser } from '@/lib/auth/server'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user })
=======
import { parseCookies } from '@/lib/auth/csrf'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { resolveUserSession } from '@/lib/auth/session-store'
import { setAuthCookie } from '@/lib/auth/cookies'

export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json({ ok: true, user: user ?? null })
>>>>>>> main
}
