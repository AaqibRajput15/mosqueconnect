import type { UserRole } from '@/lib/types'

export interface AuditLogEntry {
  id: string
  action: string
  actorId?: string
  actorRole?: UserRole
  path: string
  status: 'allowed' | 'denied'
  createdAt: string
  metadata?: Record<string, unknown>
}

const auditLogs: AuditLogEntry[] = []

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
  const row: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  auditLogs.unshift(row)
  if (auditLogs.length > 200) auditLogs.length = 200

  console.info('[audit]', row)
  return row
}

export function listAuditLogs() {
  return auditLogs
}
