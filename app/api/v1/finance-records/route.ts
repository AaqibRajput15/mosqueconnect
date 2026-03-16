import { NextResponse } from 'next/server'
import { createFinanceRecordSchema } from './schema'
import { financeRecordRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'finance:read')
  if ('error' in auth) return auth.error
  const rows = await financeRecordRepository.list()
  return NextResponse.json({ data: rows.map((record) => ({ ...record, recordType: record.type })) })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'finance:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const normalized = body.recordType && !body.type ? { ...body, type: body.recordType } : body
  const payload = createFinanceRecordSchema.omit({ id: true, createdAt: true }).parse(normalized)
  const created = await financeRecordRepository.create(payload)
  return NextResponse.json({ data: { ...created, recordType: created.type } }, { status: 201 })
}
