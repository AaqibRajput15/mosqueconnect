import { NextResponse } from 'next/server'
import { consumeOneTimeToken } from '@/lib/auth/one-time-token-store'

export async function POST(request: Request) {
  const body = await request.json()
  const token = String(body.token ?? '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const user = await consumeOneTimeToken({ token, purpose: 'verify_email' })
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  user.emailVerified = true
  return NextResponse.json({ ok: true })
}
