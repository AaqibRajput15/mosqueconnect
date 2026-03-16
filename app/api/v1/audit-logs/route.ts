import { NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/server'
import { listAuditLogs } from '@/lib/auth/audit-log'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'audit', action: 'read' })
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: listAuditLogs() })
}
