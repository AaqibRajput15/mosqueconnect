import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { User, UserRole } from '@/lib/types'
import { buildAuditContext, logAudit } from './audit-log'
import { canAccessRoute, evaluatePermission, type AuthorizationScope, type Permission } from './permissions'
import { canAccessPrivilegedRoute } from './email-verification-policy'
import { resolveUserSession } from './session-store'

export const AUTH_COOKIE = 'mc_session'
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const roleHomeMap: Record<UserRole, string> = {
  admin: '/admin',
  shura: '/shura',
  mosque_admin: '/community',
  member: '/community',
  visitor: '/mosques',
}

interface ApiAuthContext {
  role: UserRole
  scope: AuthorizationScope
}

interface ApiAuthorizedResult {
  user: User
  rotatedToken?: string
  context: ApiAuthContext
}

interface ApiDeniedResult {
  error: NextResponse
}

function getProtectedRoute(pathname: string): '/admin' | '/shura' | null {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/shura')) return '/shura'
  return null
}

function getTokenFromCookieHeader(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]
}

export function getDefaultDashboard(role: UserRole) {
  return roleHomeMap[role]
}

export async function getSessionUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  return resolveUserSession(token).user
}

export async function guardRouteAccess(pathname: string) {
  const user = await getSessionUser()

  if (pathname.startsWith('/auth')) {
    if (user) return { redirectPath: getDefaultDashboard(user.role) }
    return { user: null }
  }

  const protectedRoute = getProtectedRoute(pathname)
  if (!protectedRoute) return { user }

  if (!user) return { redirectPath: '/auth/sign-in' }
  if (!canAccessRoute(user.role, protectedRoute)) return { redirectPath: '/forbidden' }

  return { user }
}

export async function requireRouteAccess(pathname: string) {
  const guardResult = await guardRouteAccess(pathname)
  if (guardResult.redirectPath) {
    return { redirect: NextResponse.redirect(new URL(guardResult.redirectPath, APP_ORIGIN)) }
  }

  return { user: guardResult.user ?? null }
}

export async function requireApiPermission(
  request: Request,
  permission: Permission,
  options?: { scope?: AuthorizationScope },
): Promise<ApiDeniedResult | { user: User; scope: AuthorizationScope; rotatedToken?: string }> {
  const token = getTokenFromCookieHeader(request)
  const resolved = resolveUserSession(token)
  const user = resolved.user
  const context = buildAuditContext(request)

  if (!user) {
    await logAudit({
      eventType: 'rbac.denied',
      outcome: 'failure',
      ...context,
      metadata: { permission, reason: 'unauthenticated' },
    })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const scope: AuthorizationScope = {
    mosqueId: options?.scope?.mosqueId ?? user.mosqueId,
    tenantId: options?.scope?.tenantId,
  }

  const evaluation = evaluatePermission({ permission, role: user.role, user, scope })
  if (!evaluation.allowed) {
    await logAudit({
      eventType: 'rbac.denied',
      outcome: 'failure',
      actorId: user.id,
      actorRole: user.role,
      ...context,
      metadata: { permission, reason: evaluation.reason, scope },
    })
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (!canAccessPrivilegedRoute(user)) {
    await logAudit({
      eventType: 'rbac.denied',
      outcome: 'failure',
      actorId: user.id,
      actorRole: user.role,
      ...context,
      metadata: { permission, reason: 'email_unverified' },
    })
    return { error: NextResponse.json({ error: 'Email verification required' }, { status: 403 }) }
  }

  return { user, scope, rotatedToken: resolved.rotatedToken }
}

export async function authorizeApiRequest(
  request: Request,
  options: { resource: string; action: 'view' | 'read' | 'create' | 'update' | 'delete'; scope?: AuthorizationScope },
): Promise<ApiAuthorizedResult | ApiDeniedResult> {
  const permission = `${options.resource}:${options.action}` as Permission
  const result = await requireApiPermission(request, permission, { scope: options.scope })
  if ('error' in result) return result

  return {
    user: result.user,
    rotatedToken: result.rotatedToken,
    context: {
      role: result.user.role,
      scope: result.scope,
    },
  }
}
