import { NextResponse } from 'next/server'
import { createSessionToken, type AuthProvider, getUserForSession } from '@/lib/auth/session-store'
import { AUTH_COOKIE } from '@/lib/auth/server'

function getDefaultPath(role: string) {
  if (role === 'admin') return '/admin'
  if (role === 'shura') return '/shura'
  return '/'
}

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '').trim()
  const provider = (body.provider ?? 'credentials') as AuthProvider

  const token = createSessionToken(email, provider)
  if (!token) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const user = getUserForSession(token)
  const response = NextResponse.json({
    ok: true,
    redirectPath: getDefaultPath(user?.role ?? 'visitor'),
    user,
  })
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
