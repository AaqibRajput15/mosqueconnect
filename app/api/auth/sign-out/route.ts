import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { getUserForSession, revokeSession } from '@/lib/auth/session-store'
import { buildAuditContext, logAudit } from '@/lib/auth/audit-log'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]

  if (token) {
    revokeSession(token)
  }

  const response = NextResponse.json({ ok: true, user: null })
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  return response
}
