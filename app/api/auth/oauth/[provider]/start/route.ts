import { NextResponse } from 'next/server'
import { type AuthProvider, startOAuth } from '@/lib/auth/session-store'
import { AUTH_COOKIE } from '@/lib/auth/server'

const validProviders: AuthProvider[] = ['google', 'microsoft']

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params
  if (!validProviders.includes(provider as AuthProvider)) {
    return NextResponse.json({ errorCode: 'provider_mismatch' }, { status: 400 })
  }

  const body = await request.json()
  const email = String(body.email ?? '')
  const intent = body.intent === 'sign-up' ? 'sign-up' : 'sign-in'

  const { session, errorCode } = startOAuth(email, provider as AuthProvider, intent)

  if (!session) {
    return NextResponse.json({ errorCode: errorCode ?? 'provider_mismatch' }, { status: 409 })
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
