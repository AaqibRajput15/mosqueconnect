import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types'
import { getUserForSession } from './session-store'
import { canAccessRoute, hasPermission, type Permission } from './permissions'
import { buildAuditContext, logAudit } from './audit-log'

export const AUTH_COOKIE = 'mc_session'

export async function getSessionUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  return getUserForSession(token)
}

export async function requireRouteAccess(route: '/admin' | '/shura') {
  const user = await getSessionUser()
  if (!user) {
    return { redirect: NextResponse.redirect(new URL('/unauthorized', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')) }
  }

  if (!canAccessRoute(user.role, route)) {
    return { redirect: NextResponse.redirect(new URL('/forbidden', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')) }
  }

  return { user }
}

export async function requireApiPermission(request: Request, permission: Permission) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]

  const user = getUserForSession(token)
  const context = buildAuditContext(request)

  if (!user) {
    void logAudit({
      eventType: 'rbac.denied',
      targetResource: context.targetResource,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'failure',
      metadata: { reason: 'unauthenticated', permission },
    })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!hasPermission(user.role as UserRole, permission)) {
    void logAudit({
      eventType: 'rbac.denied',
      actorId: user.id,
      actorRole: user.role,
      targetResource: context.targetResource,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'failure',
      metadata: { reason: 'forbidden', permission },
    })
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  void logAudit({
    eventType: 'api.sensitive_action',
    actorId: user.id,
    actorRole: user.role,
    targetResource: context.targetResource,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    outcome: 'success',
    metadata: { permission },
  })

  return { user }
}
