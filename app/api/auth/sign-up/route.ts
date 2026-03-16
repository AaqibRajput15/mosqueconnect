import { NextResponse } from 'next/server'
import { registerWithCredentials } from '@/lib/auth/session-store'
import { AUTH_COOKIE } from '@/lib/auth/server'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '')
  const password = String(body.password ?? '')

  const { session, errorCode } = registerWithCredentials(email, password)

  if (!session) {
    return NextResponse.json({ errorCode: errorCode ?? 'account_exists' }, { status: 409 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
