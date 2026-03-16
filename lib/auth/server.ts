import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
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

export const AUTH_COOKIE = 'mc_session'

export interface AuthorizedApiContext {
  user: User
  role: User['role']
  scope: AuthorizationScope
}

interface AuthorizationOptions {
  resource: PermissionResource
  action: PermissionAction
  scope?: AuthorizationScope
}

function getTokenFromCookieHeader(cookieHeader: string) {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1]
}

function logApiAuthorization(
  request: Request,
  permission: Permission,
  status: 'allowed' | 'denied',
  user?: User,
  metadata?: Record<string, unknown>,
) {
  logAudit({
    action: `api:${permission}`,
    actorId: user?.id,
    actorRole: user?.role,
    path: request.url,
    status,
    metadata,
  })
}

export async function getSessionUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  return getUserForSession(token)
}

export async function requireRouteAccess(route: '/admin' | '/shura') {
  const user = await getSessionUser()
  if (!user) {
    return {
      redirect: NextResponse.redirect(
        new URL('/unauthorized', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
      ),
    }
  }

  if (!canAccessRoute(user.role, route)) {
    return {
      redirect: NextResponse.redirect(
        new URL('/forbidden', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
      ),
    }
  }

  return { user }
}

export async function authorizeApiRequest(request: Request, options: AuthorizationOptions) {
  const permission = `${options.resource}:${options.action}` as Permission
  const token = getTokenFromCookieHeader(request.headers.get('cookie') ?? '')
  const user = getUserForSession(token)

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

  const context: AuthorizedApiContext = {
    user,
    role: user.role,
    scope,
  }

  logApiAuthorization(request, permission, 'allowed', user, { scope })
  return { context }
}
