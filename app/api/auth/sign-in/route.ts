import { NextResponse } from 'next/server'
import { createSession, type AuthProvider } from '@/lib/auth/session-store'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { buildAuditContext, logAudit } from '@/lib/auth/audit-log'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email ?? '')
  const provider = (body.provider ?? 'credentials') as AuthProvider
  const context = buildAuditContext(request)

  const session = createSession(email, provider)
  if (!session) {
    void logAudit({
      eventType: 'auth.failed_login',
      targetResource: context.targetResource,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'failure',
      metadata: { email, provider },
    })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  void logAudit({
    eventType: 'auth.sign_in',
    actorId: session.userId,
    targetResource: context.targetResource,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    outcome: 'success',
    metadata: { provider },
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
