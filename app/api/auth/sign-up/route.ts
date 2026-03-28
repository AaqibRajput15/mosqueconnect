import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setAuthCookie } from '@/lib/auth/cookies'
import { hashPassword } from '@/lib/auth/password'
import { registerCredentialsAccount } from '@/lib/auth/session-store'

const signUpSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
})

const GENERIC_AUTH_ERROR = 'Invalid email or password'

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 400 })
  }

  const parsed = signUpSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 400 })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const registration = registerCredentialsAccount({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
  })
  if ('error' in registration) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR, errorCode: 'account_exists' }, { status: 409 })
  }

  const response = NextResponse.json({ ok: true, user: registration.user }, { status: 201 })
  setAuthCookie(response, registration.session.token)

  return response
}
