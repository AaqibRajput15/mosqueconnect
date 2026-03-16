import { NextResponse } from 'next/server'
import { z } from 'zod'
<<<<<<< HEAD
import { appDataStore, generateId } from '@/lib/server-data'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { createSessionToken, type AuthProvider, getUserForSession } from '@/lib/auth/session-store'

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  provider: z.enum(['credentials', 'google', 'microsoft']).default('credentials'),
})

function getDefaultPath(role: string) {
  if (role === 'admin') return '/admin'
  if (role === 'shura') return '/shura'
  return '/'
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = signUpSchema.parse(body)

  const existing = appDataStore.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase())
  if (existing) {
    return NextResponse.json({ error: 'Account already exists. Please sign in.' }, { status: 409 })
  }

  const user = {
    id: generateId('user'),
    email: payload.email,
    name: payload.name,
    role: 'member' as const,
    createdAt: new Date().toISOString(),
  }
  appDataStore.users.push(user)

  const token = createSessionToken(payload.email, payload.provider as AuthProvider)
  if (!token) {
    return NextResponse.json({ error: 'Unable to create session' }, { status: 500 })
  }

  const sessionUser = getUserForSession(token)
  const response = NextResponse.json({ ok: true, user: sessionUser, redirectPath: getDefaultPath(user.role) }, { status: 201 })
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
=======
import { AUTH_COOKIE } from '@/lib/auth/server'
import { hashPassword } from '@/lib/auth/password'
import { registerCredentialsAccount, SESSION_TTL_SECONDS } from '@/lib/auth/session-store'

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
  const result = registerCredentialsAccount({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
  })

  if ('error' in result) {
    return NextResponse.json({ ok: false, error: GENERIC_AUTH_ERROR }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, user: result.user }, { status: 201 })
  response.cookies.set(AUTH_COOKIE, result.session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
>>>>>>> main
  })

  return response
}
