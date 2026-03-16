import { NextResponse } from 'next/server'
import { createFinanceRecordSchema } from '../schema'
import { financeRecordRepository } from '@/lib/backend/repositories'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await financeRecordRepository.getById(id)
  return item ? NextResponse.json({ data: { ...item, recordType: item.type } }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const normalized = body.recordType && !body.type ? { ...body, type: body.recordType } : body
  const payload = createFinanceRecordSchema.partial().parse(normalized)
  const updated = await financeRecordRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { ...updated, recordType: updated.type } })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const removed = await financeRecordRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: { ...removed, recordType: removed.type } })
}
