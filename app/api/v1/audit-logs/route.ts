import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth/server'
import { listAuditLogs } from '@/lib/auth/audit-log'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'audit:read')
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: listAuditLogs() })
}
