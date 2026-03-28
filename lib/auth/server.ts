import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { User, UserRole } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'
import { deserializeSessionCookie, serializeSessionCookie, type SessionCookiePayload } from './cookies'
import { buildAuditContext, logAudit } from './audit-log'
import { canAccessRoute, evaluatePermission, type AuthorizationScope, type Permission } from './permissions'
import { canAccessPrivilegedRoute } from './email-verification-policy'
import {
  getSupabaseUserFromAccessToken,
  isSupabaseAuthEnabled,
  refreshSupabaseSession,
  type SupabaseAuthUser,
} from './supabase-auth'

export const AUTH_COOKIE = 'mc_session'
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const ROTATE_WINDOW_MS = 1000 * 60 * 5

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

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return undefined
  return authHeader.slice(7).trim() || undefined
}

function resolveAppUser(authUser: SupabaseAuthUser | null) {
  if (!authUser?.id) return null
  return appDataStore.users.find((user) => user.id === authUser.id) ?? null
}

function isMfaRequiredForRole(role: UserRole) {
  if (process.env.AUTH_MFA_ENABLED !== 'true') return false

  const configuredRoles = (process.env.AUTH_MFA_ROLES ?? 'admin,shura')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return configuredRoles.includes(role)
}

function hasVerifiedMfaFactor(authUser: SupabaseAuthUser | null) {
  return Boolean(authUser?.factors?.some((factor) => factor.status === 'verified'))
}

async function resolveAuthenticatedUser(request?: Request): Promise<{ user: User | null; authUser: SupabaseAuthUser | null; rotatedToken?: string }> {
  if (!isSupabaseAuthEnabled()) return { user: null, authUser: null }

  const bearerToken = request ? getBearerToken(request) : undefined
  if (bearerToken) {
    const authUser = await getSupabaseUserFromAccessToken(bearerToken)
    return { user: resolveAppUser(authUser), authUser }
  }

  const cookieToken = request ? getTokenFromCookieHeader(request) : (await cookies()).get(AUTH_COOKIE)?.value
  const cookieSession = deserializeSessionCookie(cookieToken)
  if (!cookieSession) return { user: null, authUser: null }

  const now = Date.now()
  let activeSession: SessionCookiePayload = cookieSession
  let shouldRotate = now - cookieSession.issuedAt >= ROTATE_WINDOW_MS

  if (cookieSession.expiresAt <= now + 60_000) {
    const refreshed = await refreshSupabaseSession(cookieSession.refreshToken)
    if (!refreshed) return { user: null, authUser: null }

    activeSession = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
      issuedAt: now,
    }
    shouldRotate = true
  }

  const authUser = await getSupabaseUserFromAccessToken(activeSession.accessToken)
  const user = resolveAppUser(authUser)

  if (!user) return { user: null, authUser }

  return {
    user,
    authUser,
    rotatedToken: shouldRotate ? serializeSessionCookie({ ...activeSession, issuedAt: now }) : undefined,
  }
}

export function getDefaultDashboard(role: UserRole) {
  return roleHomeMap[role]
}

export async function getSessionUser() {
  const { user } = await resolveAuthenticatedUser()
  return user
}

export async function guardRouteAccess(pathname: string) {
  const { user } = await resolveAuthenticatedUser()

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
  const resolved = await resolveAuthenticatedUser(request)
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

  if (isMfaRequiredForRole(user.role) && !hasVerifiedMfaFactor(resolved.authUser)) {
    await logAudit({
      eventType: 'rbac.denied',
      outcome: 'failure',
      actorId: user.id,
      actorRole: user.role,
      ...context,
      metadata: { permission, reason: 'mfa_required' },
    })
    return { error: NextResponse.json({ error: 'MFA required' }, { status: 403 }) }
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
