import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serializeSessionCookie, setAuthCookie } from '@/lib/auth/cookies'
import { appDataStore } from '@/lib/server-data'
import { isSupabaseAuthEnabled, signInWithSupabasePassword } from '@/lib/auth/supabase-auth'

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
})

const GENERIC_AUTH_ERROR = 'Invalid email or password'

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ ok: false, error: 'Supabase auth is not configured' }, { status: 503 })
  }

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

  const session = await signInWithSupabasePassword(parsed.data.email, parsed.data.password)
  if (!session) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 401 })
  }

  const user = appDataStore.users.find((candidate) => candidate.id === session.user.id)
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, user })
  setAuthCookie(
    response,
    serializeSessionCookie({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      issuedAt: Date.now(),
    }),
  )

  return response
}
