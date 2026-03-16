import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'
import { listAuditLogs } from '@/lib/auth/audit-log'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'audit:read')
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: listAuditLogs() })
=======
import { authorizeApiRequest } from '@/lib/auth/server'
import { listAuditLogs } from '@/lib/auth/audit-log'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'audit', action: 'read' })
  if ('error' in auth) return auth.error

  if (auth.user.role !== 'admin') {
    const context = buildAuditContext(request)
    void logAudit({
      eventType: 'rbac.denied',
      actorId: auth.user.id,
      actorRole: auth.user.role,
      targetResource: context.targetResource,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'failure',
      metadata: { reason: 'admin_only_audit_logs' },
    })

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '25')

  const eventType = searchParams.get('eventType') as AuditEventType | null
  const outcome = searchParams.get('outcome') as AuditOutcome | null

  const result = await listAuditLogs({
    page,
    pageSize,
    filters: {
      eventType: eventType ?? undefined,
      actorId: searchParams.get('actorId') ?? undefined,
      targetResource: searchParams.get('targetResource') ?? undefined,
      requestId: searchParams.get('requestId') ?? undefined,
      outcome: outcome ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
    },
  })

  return NextResponse.json(result)
>>>>>>> main
}
