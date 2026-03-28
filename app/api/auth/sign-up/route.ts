import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serializeSessionCookie, setAuthCookie } from '@/lib/auth/cookies'
import type { User } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'
import { isSupabaseAuthEnabled, signUpWithSupabasePassword } from '@/lib/auth/supabase-auth'

const signUpSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
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

  const parsed = signUpSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 400 })
  }

  const session = await signUpWithSupabasePassword(parsed.data.email, parsed.data.password, {
    display_name: parsed.data.name?.trim() || parsed.data.email,
  })

  if (!session) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 401 })
  }

  let user = appDataStore.users.find((candidate) => candidate.id === session.user.id)
  if (!user) {
    user = {
      id: session.user.id,
      email: parsed.data.email.toLowerCase().trim(),
      name: parsed.data.name?.trim() || 'New User',
      role: 'member',
      createdAt: new Date().toISOString(),
      emailVerified: false,
    } satisfies User
    appDataStore.users.push(user)
  }

  const response = NextResponse.json({ ok: true, user }, { status: 201 })
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
