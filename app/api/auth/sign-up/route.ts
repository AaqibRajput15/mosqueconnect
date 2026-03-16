import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { createSession, createUser } from '@/lib/auth/session-store'
import { hashPassword } from '@/lib/auth/utils'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '').trim().toLowerCase()
  const name = String(body.name ?? '').trim() || 'New Member'
  const password = String(body.password ?? '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  hashPassword(password)
  createUser(email, name)

  const session = createSession(email, 'credentials')
  if (!session) {
    return NextResponse.json({ error: 'Unable to create session' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true, user: { email, name } }, { status: 201 })
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
