import { NextResponse } from 'next/server'
import { createOneTimeToken } from '@/lib/auth/one-time-token-store'
import { getOneTimeTokenRateLimitKey, isLockedOut, registerRateLimitedAction } from '@/lib/auth/rate-limit'
import { sendResetPasswordEmail } from '@/lib/auth/email-adapter'
import { appDataStore } from '@/lib/server-data'

const SUCCESS_RESPONSE = { ok: true }

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const rateLimitKey = getOneTimeTokenRateLimitKey(request, email, 'reset_password')
  if (isLockedOut(rateLimitKey)) {
    return NextResponse.json(SUCCESS_RESPONSE)
  }

  registerRateLimitedAction(rateLimitKey)

  const user = appDataStore.users.find((candidate) => candidate.email.toLowerCase() === email)
  if (!user) {
    return NextResponse.json(SUCCESS_RESPONSE)
  }

  const { token } = await createOneTimeToken({
    userId: user.id,
    purpose: 'reset_password',
    ttlMinutes: 15,
  })

  await sendResetPasswordEmail({ userId: user.id, token })

  return NextResponse.json(SUCCESS_RESPONSE)
}
