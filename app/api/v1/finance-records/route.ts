import { NextResponse } from 'next/server'
import { createFinanceRecordSchema } from './schema'
import { financeRecordRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'finance', action: 'read' })
  if ('error' in auth) return auth.error
  const rows = await financeRecordRepository.list()
  const visibleRows = auth.context.role === 'admin'
    ? rows
    : rows.filter((record) => record.mosqueId === auth.context.scope.mosqueId)
  const response = NextResponse.json({ data: visibleRows.map((record) => ({ ...record, recordType: record.type })) })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
  const body = await request.json()
  const normalized = body.recordType && !body.type ? { ...body, type: body.recordType } : body
  const payload = createFinanceRecordSchema.omit({ id: true, createdAt: true }).parse(normalized)

  const auth = await authorizeApiRequest(request, {
    resource: 'finance',
    action: 'create',
    scope: { mosqueId: payload.mosqueId },
  })
  if ('error' in auth) return auth.error

  const created = await financeRecordRepository.create(
    auth.context.role === 'admin' ? payload : { ...payload, mosqueId: auth.context.scope.mosqueId ?? payload.mosqueId },
  )
  const response = NextResponse.json({ data: { ...created, recordType: created.type } }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
