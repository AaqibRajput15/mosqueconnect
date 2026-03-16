<<<<<<< HEAD
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
=======
import { randomUUID } from 'crypto'
import { backendConfig, isSupabaseEnabled } from '@/lib/backend/config'
import type { UserRole } from '@/lib/types'

export type AuditEventType =
  | 'auth.sign_in'
  | 'auth.sign_out'
  | 'auth.failed_login'
  | 'rbac.denied'
  | 'api.sensitive_action'

export type AuditOutcome = 'success' | 'failure'

export interface AuditLogEntry {
  id: string
  eventType: AuditEventType
  actorId?: string
  actorRole?: UserRole
  targetResource?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  outcome: AuditOutcome
  metadata?: Record<string, unknown>
}

interface AuditLogDbRow {
  id: string
  event_type: AuditEventType
  actor_id?: string | null
  actor_role?: UserRole | null
  target_resource?: string | null
  request_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  timestamp: string
  outcome: AuditOutcome
  metadata?: Record<string, unknown> | null
}

export interface ListAuditLogsFilters {
  eventType?: AuditEventType
  actorId?: string
  targetResource?: string
  requestId?: string
  outcome?: AuditOutcome
  from?: string
  to?: string
}

export interface ListAuditLogsOptions {
  page?: number
  pageSize?: number
  filters?: ListAuditLogsFilters
}

export interface ListAuditLogsResult {
  data: AuditLogEntry[]
  page: number
  pageSize: number
  total: number
}

const sensitiveKeyPattern = /(token|secret|password|authorization|cookie|api[-_]?key|credential|session)/i
const jwtLikePattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/

function redactMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactMetadata(item))
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(source).map(([key, entryValue]) => {
        if (sensitiveKeyPattern.test(key)) return [key, '[REDACTED]']
        return [key, redactMetadata(entryValue)]
      }),
    )
  }

  if (typeof value === 'string') {
    if (jwtLikePattern.test(value)) return '[REDACTED_JWT]'
    if (value.length > 40 && /(bearer\s+|eyJ)/i.test(value)) return '[REDACTED_TOKEN]'
  }

  return value
}

function tableUrl(query = '') {
  return `${backendConfig.supabaseUrl}/rest/v1/audit_logs${query}`
}

function baseHeaders(extra?: HeadersInit) {
  return {
    apikey: backendConfig.serviceRoleKey as string,
    Authorization: `Bearer ${backendConfig.serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...(extra ?? {}),
  }
}

function fromDbRow(row: AuditLogDbRow): AuditLogEntry {
  return {
    id: row.id,
    eventType: row.event_type,
    actorId: row.actor_id ?? undefined,
    actorRole: row.actor_role ?? undefined,
    targetResource: row.target_resource ?? undefined,
    requestId: row.request_id ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    timestamp: row.timestamp,
    outcome: row.outcome,
    metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined,
  }
}

function toDbPayload(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Omit<AuditLogDbRow, 'id'> {
  return {
    event_type: entry.eventType,
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    target_resource: entry.targetResource,
    request_id: entry.requestId,
    ip_address: entry.ipAddress,
    user_agent: entry.userAgent,
    timestamp: new Date().toISOString(),
    outcome: entry.outcome,
    metadata: (redactMetadata(entry.metadata ?? {}) as Record<string, unknown>) ?? {},
  }
}

export async function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry | null> {
  const payload = toDbPayload(entry)

  if (!isSupabaseEnabled()) {
    console.warn('[audit] skipped write because DB backend is not configured')
    return null
  }

  try {
    const response = await fetch(tableUrl(), {
      method: 'POST',
      headers: baseHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as AuditLogDbRow[]
    const row = rows[0]
    return row ? fromDbRow(row) : null
  } catch (error) {
    console.error('[audit] failed to write', error)
    return null
  }
}

export async function listAuditLogs(options: ListAuditLogsOptions = {}): Promise<ListAuditLogsResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize ?? 25)))

  if (!isSupabaseEnabled()) {
    return { data: [], page, pageSize, total: 0 }
  }

  const filters = options.filters ?? {}
  const params = new URLSearchParams()
  params.set('select', '*')
  params.set('order', 'timestamp.desc')

  if (filters.eventType) params.set('event_type', `eq.${filters.eventType}`)
  if (filters.actorId) params.set('actor_id', `eq.${filters.actorId}`)
  if (filters.targetResource) params.set('target_resource', `ilike.*${filters.targetResource}*`)
  if (filters.requestId) params.set('request_id', `eq.${filters.requestId}`)
  if (filters.outcome) params.set('outcome', `eq.${filters.outcome}`)
  if (filters.from) params.append('timestamp', `gte.${filters.from}`)
  if (filters.to) params.append('timestamp', `lte.${filters.to}`)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const response = await fetch(tableUrl(`?${params.toString()}`), {
    headers: baseHeaders({ Prefer: 'count=exact', Range: `${from}-${to}` }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const totalFromHeader = Number(response.headers.get('content-range')?.split('/')[1] ?? 0)
  const rows = (await response.json()) as AuditLogDbRow[]

  return {
    data: rows.map(fromDbRow),
    page,
    pageSize,
    total: Number.isFinite(totalFromHeader) ? totalFromHeader : rows.length,
  }
}

export function buildAuditContext(request: Request) {
  const url = new URL(request.url)
  return {
    targetResource: `${request.method} ${url.pathname}`,
    requestId: request.headers.get('x-request-id') ?? randomUUID(),
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
>>>>>>> main
}
