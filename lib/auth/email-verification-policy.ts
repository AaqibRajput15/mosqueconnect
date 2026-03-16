import type { User, UserRole } from '@/lib/types'

const privilegedRoles: UserRole[] = ['admin', 'shura', 'mosque_admin']

function parseRoleList(raw: string | undefined): UserRole[] {
  if (!raw) return privilegedRoles
  const roles = raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean) as UserRole[]
  return roles.length > 0 ? roles : privilegedRoles
}

export function mustVerifyEmail(user: User) {
  const enforcedInProd = process.env.AUTH_ENFORCE_VERIFIED_IN_PRODUCTION !== 'false'
  const shouldCheckEnv = process.env.NODE_ENV === 'production' ? enforcedInProd : process.env.AUTH_ENFORCE_VERIFIED_IN_NON_PROD === 'true'
  if (!shouldCheckEnv) return false

  const roles = parseRoleList(process.env.AUTH_VERIFIED_REQUIRED_ROLES)
  return roles.includes(user.role)
}

export function canAccessPrivilegedRoute(user: User) {
  if (!mustVerifyEmail(user)) return true
  return user.emailVerified === true
}
