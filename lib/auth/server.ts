import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types'
import { parseCookies } from './csrf'
import { hasPermission, canAccessRoute, type Permission } from './permissions'
import { logAudit } from './audit-log'
import { resolveUserSession } from './session-store'

export const AUTH_COOKIE = 'mc_session'

export async function getSessionUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  return resolveUserSession(token).user
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
  const token = parseCookies(request)[AUTH_COOKIE]
  const resolved = resolveUserSession(token)
  const user = resolved.user

  if (!user) {
    logAudit({ action: `api:${permission}`, path: request.url, status: 'denied', metadata: { reason: 'unauthenticated' } })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!hasPermission(user.role as UserRole, permission)) {
    logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'denied', metadata: { reason: 'forbidden' } })
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  logAudit({ action: `api:${permission}`, actorId: user.id, actorRole: user.role, path: request.url, status: 'allowed' })
  return { user, rotatedToken: resolved.rotatedToken }
}
