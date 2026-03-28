import { NextResponse } from 'next/server'
import { consumeOneTimeToken } from '@/lib/auth/one-time-token-store'
import { hashPassword } from '@/lib/auth/password'
import { revokeAllSessionsForUser, updateCredentialsIdentityPassword } from '@/lib/auth/session-store'

export async function POST(request: Request) {
  const body = await request.json()
  const token = String(body.token ?? '').trim()
  const newPassword = String(body.newPassword ?? '')

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await consumeOneTimeToken({ token, purpose: 'reset_password' })
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const passwordHash = await hashPassword(newPassword)
  const updated = updateCredentialsIdentityPassword(user.id, passwordHash)
  if (!updated) {
    return NextResponse.json({ error: 'Unable to reset password for this account' }, { status: 400 })
  }

  revokeAllSessionsForUser(user.id)

  return NextResponse.json({ ok: true })
}
