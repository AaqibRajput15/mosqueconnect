import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import type { User } from '@/lib/types'
import { createSession } from '@/lib/auth/session-store'
import { getAuthRateLimitKey, getLockoutRetryAfterSeconds, isLockedOut, registerAuthFailure, registerAuthSuccess } from '@/lib/auth/rate-limit'
import { setAuthCookie } from '@/lib/auth/cookies'
import { validateCsrfToken } from '@/lib/auth/csrf'

export async function POST(request: Request) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const body = await request.json()
  const email = String(body.email ?? '').trim().toLowerCase()
  const name = String(body.name ?? '').trim() || email
  const key = getAuthRateLimitKey(request, email)

  if (isLockedOut(key)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(getLockoutRetryAfterSeconds(key)) } },
    )
  }

  if (!email || appDataStore.users.some((u) => u.email.toLowerCase() === email)) {
    registerAuthFailure(key)
    return NextResponse.json({ error: 'Unable to create account' }, { status: 400 })
  }

  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: 'member',
    mosqueId: undefined,
    createdAt: new Date().toISOString(),
  }

  appDataStore.users.push(user)
  const session = createSession(email, 'credentials')
  if (!session) {
    registerAuthFailure(key)
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 })
  }

  registerAuthSuccess(key)
  const response = NextResponse.json({ ok: true, user }, { status: 201 })
  setAuthCookie(response, session.token)
  return response
}
