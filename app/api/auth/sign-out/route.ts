import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { revokeSession } from '@/lib/auth/session-store'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]

  if (token) revokeSession(token)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}
