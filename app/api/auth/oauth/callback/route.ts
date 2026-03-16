import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { createSession, createUser, type AuthProvider } from '@/lib/auth/session-store'

const providers = new Set<AuthProvider>(['google', 'microsoft'])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? ''
  const provider = (url.searchParams.get('provider') ?? 'google') as AuthProvider
  const name = url.searchParams.get('name')?.trim() ?? 'OAuth User'

  if (!email || !providers.has(provider)) {
    return NextResponse.json({ error: 'Invalid OAuth callback parameters' }, { status: 400 })
  }

  createUser(email, name)
  const session = createSession(email, provider)

  if (!session) {
    return NextResponse.json({ error: 'Unable to create session' }, { status: 500 })
  }

  const response = NextResponse.redirect(new URL('/admin', url.origin))
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
