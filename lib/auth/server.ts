import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
<<<<<<< HEAD
import type { UserRole } from '@/lib/types'
import { getUserForSession } from './session-store'
import { canAccessRoute, hasPermission, type Permission } from './permissions'
import { logAudit } from './audit-log'

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
=======
import type { User } from '@/lib/types'
import { getUserForSession } from './session-store'
import {
  canAccessRoute,
  evaluatePermission,
  type AuthorizationScope,
  type Permission,
  type PermissionAction,
  type PermissionResource,
} from './permissions'
import { logAudit } from './audit-log'
import { canAccessPrivilegedRoute } from './email-verification-policy'

export const AUTH_COOKIE = 'mc_session'

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const roleHomeMap: Record<UserRole, string> = {
  admin: '/admin',
  shura: '/shura',
  mosque_admin: '/community',
  member: '/community',
  visitor: '/mosques',
}

function getProtectedRoute(pathname: string): '/admin' | '/shura' | null {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/shura')) return '/shura'
  return null
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

  if (!protectedRoute) {
    return { user }
  }

  if (!user) {
    return { redirectPath: '/auth/sign-in' }
  }

  if (!canAccessRoute(user.role, protectedRoute)) {
    return { redirectPath: '/forbidden' }
>>>>>>> main
  }

  return { user }
}

<<<<<<< HEAD
=======
export async function requireRouteAccess(pathname: string) {
  const guardResult = await guardRouteAccess(pathname)
  if (guardResult.redirectPath) {
    return { redirect: NextResponse.redirect(new URL(guardResult.redirectPath, APP_ORIGIN)) }
  }

  return { user: guardResult.user ?? null }
}

>>>>>>> main
export async function requireApiPermission(request: Request, permission: Permission) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]

  const user = getUserForSession(token)
<<<<<<< HEAD

  if (!user) {
    logAudit({ action: `api:${permission}`, path: request.url, status: 'denied', metadata: { reason: 'unauthenticated' } })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!hasPermission(user.role as UserRole, permission)) {
    logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'denied', metadata: { reason: 'forbidden' } })
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'allowed' })
  return { user }
=======
  const context = buildAuditContext(request)

  if (!user) {
    logApiAuthorization(request, permission, 'denied', undefined, {
      reason: 'unauthenticated',
      scope: options.scope,
    })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const scope: AuthorizationScope = {
    mosqueId: options.scope?.mosqueId ?? user.mosqueId,
    tenantId: options.scope?.tenantId,
  }

  const evaluation = evaluatePermission({ permission, role: user.role, user, scope })

  if (!evaluation.allowed) {
    logApiAuthorization(request, permission, 'denied', user, {
      reason: evaluation.reason,
      scope,
    })
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (!canAccessPrivilegedRoute(user)) {
    logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'denied', metadata: { reason: 'email_unverified' } })
    return { error: NextResponse.json({ error: 'Email verification required' }, { status: 403 }) }
  }

  logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'allowed' })
  return { user, rotatedToken: resolved.rotatedToken }
>>>>>>> main
}
