import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { authenticateWithCredentials, createSessionForUserId, SESSION_TTL_SECONDS } from '@/lib/auth/session-store'

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})

const GENERIC_AUTH_ERROR = 'Invalid email or password'

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 400 })
  }

  const parsed = signInSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 400 })
  }

  const user = await authenticateWithCredentials(parsed.data.email, parsed.data.password)
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 401 })
  }

  const session = createSessionForUserId(user.id, 'credentials')

  const response = NextResponse.json({ ok: true, user })
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  return response
}
