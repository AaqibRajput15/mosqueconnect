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

  const context = buildAuditContext(request)
  const actor = getUserForSession(token)

  if (token) revokeSession(token)

  void logAudit({
    eventType: 'auth.sign_out',
    actorId: actor?.id,
    actorRole: actor?.role,
    targetResource: context.targetResource,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    outcome: 'success',
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}
