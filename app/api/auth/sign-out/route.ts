import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}
