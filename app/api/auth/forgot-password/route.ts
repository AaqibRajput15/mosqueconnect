import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createOneTimeToken } from '@/lib/auth/one-time-token-store'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = appDataStore.users.find((candidate) => candidate.email.toLowerCase() === email)
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const { token, expiresAt } = await createOneTimeToken({
    userId: user.id,
    purpose: 'reset_password',
    ttlMinutes: 15,
  })

  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    resetUrl: `/auth/reset-password?token=${token}`,
  })
}
