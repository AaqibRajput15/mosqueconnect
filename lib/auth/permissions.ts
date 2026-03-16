<<<<<<< HEAD
import type { UserRole } from '@/lib/types'
=======
import type { User, UserRole } from '@/lib/types'
>>>>>>> main

export type Permission =
  | 'dashboard:view'
  | 'mosques:read'
<<<<<<< HEAD
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
=======
  | 'mosques:create'
  | 'mosques:update'
  | 'mosques:delete'
  | 'events:read'
  | 'events:create'
  | 'events:update'
  | 'events:delete'
  | 'announcements:read'
  | 'announcements:create'
  | 'announcements:update'
  | 'announcements:delete'
  | 'finance:read'
  | 'finance:create'
  | 'finance:update'
  | 'finance:delete'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'shura:read'
  | 'shura:create'
  | 'shura:update'
  | 'shura:delete'
  | 'audit:read'
  | 'audit:create'
  | 'audit:update'
  | 'audit:delete'

export type PermissionResource = 'dashboard' | 'mosques' | 'events' | 'announcements' | 'finance' | 'users' | 'shura' | 'audit'
export type PermissionAction = 'view' | 'read' | 'create' | 'update' | 'delete'

export interface AuthorizationScope {
  mosqueId?: string
  tenantId?: string
}

interface PermissionPolicy {
  roles: UserRole[]
  ownership?: {
    field: keyof AuthorizationScope
    required: boolean
  }
}

interface PermissionEvaluationInput {
  role: UserRole
  user: Pick<User, 'mosqueId'>
  scope?: AuthorizationScope
}

export interface PermissionEvaluation {
  allowed: boolean
  reason?: 'missing_policy' | 'role_not_allowed' | 'missing_scope' | 'ownership_mismatch'
}

const permissionPolicyRegistry: Record<Permission, PermissionPolicy> = {
  'dashboard:view': { roles: ['admin', 'shura', 'mosque_admin', 'member'] },

  'mosques:read': { roles: ['admin', 'shura', 'mosque_admin', 'member', 'visitor'] },
  'mosques:create': { roles: ['admin'] },
  'mosques:update': { roles: ['admin'] },
  'mosques:delete': { roles: ['admin'] },

  'events:read': { roles: ['admin', 'shura', 'mosque_admin', 'member', 'visitor'] },
  'events:create': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'events:update': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'events:delete': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },

  'announcements:read': { roles: ['admin', 'shura', 'mosque_admin', 'member', 'visitor'] },
  'announcements:create': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'announcements:update': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'announcements:delete': {
    roles: ['admin', 'shura', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },

  'finance:read': {
    roles: ['admin', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'finance:create': {
    roles: ['admin', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'finance:update': {
    roles: ['admin', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },
  'finance:delete': {
    roles: ['admin', 'mosque_admin'],
    ownership: { field: 'mosqueId', required: true },
  },

  'users:read': { roles: ['admin', 'shura', 'mosque_admin'] },
  'users:create': { roles: ['admin'] },
  'users:update': {
    roles: ['admin'],
    ownership: { field: 'tenantId', required: false },
  },
  'users:delete': { roles: ['admin'] },

  'shura:read': { roles: ['admin', 'shura'] },
  'shura:create': { roles: ['admin', 'shura'] },
  'shura:update': { roles: ['admin', 'shura'] },
  'shura:delete': { roles: ['admin', 'shura'] },

  'audit:read': { roles: ['admin', 'shura'] },
  'audit:create': { roles: ['admin'] },
  'audit:update': { roles: ['admin'] },
  'audit:delete': { roles: ['admin'] },
}

export function hasPermission(role: UserRole, permission: Permission) {
  const policy = permissionPolicyRegistry[permission]
  return policy ? policy.roles.includes(role) : false
}

export function evaluatePermission(input: PermissionEvaluationInput & { permission: Permission }): PermissionEvaluation {
  const policy = permissionPolicyRegistry[input.permission]
  if (!policy) return { allowed: false, reason: 'missing_policy' }

  if (!policy.roles.includes(input.role)) {
    return { allowed: false, reason: 'role_not_allowed' }
  }

  if (policy.ownership?.required) {
    const scopedValue = input.scope?.[policy.ownership.field]
    if (!scopedValue) {
      if (input.role === 'admin') {
        return { allowed: true }
      }
      return { allowed: false, reason: 'missing_scope' }
    }

    if (input.role !== 'admin') {
      const userMosque = input.user.mosqueId
      if (policy.ownership.field === 'mosqueId' && userMosque && scopedValue !== userMosque) {
        return { allowed: false, reason: 'ownership_mismatch' }
      }
    }
  }

  return { allowed: true }
}

export function canAccessRoute(role: UserRole, route: '/admin' | '/shura') {
  if (route === '/admin') return hasPermission(role, 'dashboard:view') && role === 'admin'
  return hasPermission(role, 'dashboard:view') && (role === 'admin' || role === 'shura')
>>>>>>> main
}
