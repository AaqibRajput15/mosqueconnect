import { NextResponse } from 'next/server'
import { createSession, type AuthProvider } from '@/lib/auth/session-store'
import { AUTH_COOKIE, getDefaultDashboard } from '@/lib/auth/server'
import { appDataStore } from '@/lib/server-data'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '')
  const provider = (body.provider ?? 'credentials') as AuthProvider

  const session = createSession(email, provider)
  if (!session) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const user = appDataStore.users.find((candidate) => candidate.id === session.userId)

  const response = NextResponse.json({ ok: true, redirectTo: getDefaultDashboard(user?.role ?? 'admin') })
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
