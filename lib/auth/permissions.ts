import type { UserRole } from '@/lib/types'

export type Permission =
  | 'dashboard:view'
  | 'mosques:read'
  | 'mosques:write'
  | 'events:read'
  | 'events:write'
  | 'announcements:read'
  | 'announcements:write'
  | 'finance:read'
  | 'finance:write'
  | 'users:read'
  | 'users:write'
  | 'shura:read'
  | 'shura:write'
  | 'audit:read'

const rolePermissionMap: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard:view', 'mosques:read', 'mosques:write', 'events:read', 'events:write',
    'announcements:read', 'announcements:write', 'finance:read', 'finance:write',
    'users:read', 'users:write', 'shura:read', 'shura:write', 'audit:read'
  ],
  shura: [
    'dashboard:view', 'mosques:read', 'events:read', 'events:write', 'announcements:read',
    'announcements:write', 'users:read', 'shura:read', 'shura:write', 'audit:read'
  ],
  mosque_admin: [
    'dashboard:view', 'mosques:read', 'events:read', 'events:write',
    'announcements:read', 'announcements:write', 'finance:read', 'finance:write', 'users:read'
  ],
  member: ['dashboard:view', 'mosques:read', 'events:read', 'announcements:read'],
  visitor: ['mosques:read', 'events:read', 'announcements:read'],
}

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissionMap[role].includes(permission)
}

export function canAccessRoute(role: UserRole, route: '/admin' | '/shura') {
  if (route === '/admin') return role === 'admin'
  return role === 'admin' || role === 'shura'
}
