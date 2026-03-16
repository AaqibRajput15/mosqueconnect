import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createFinanceRecordSchema } from '../schema'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = appDataStore.financeRecords.find((record) => record.id === id)
  return item ? NextResponse.json({ data: { ...item, recordType: item.type } }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.financeRecords.findIndex((record) => record.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const normalized = body.recordType && !body.type ? { ...body, type: body.recordType } : body
  const payload = createFinanceRecordSchema.partial().parse(normalized)
  appDataStore.financeRecords[index] = { ...appDataStore.financeRecords[index], ...payload }
  const updated = appDataStore.financeRecords[index]
  return NextResponse.json({ data: { ...updated, recordType: updated.type } })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.financeRecords.findIndex((record) => record.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = appDataStore.financeRecords.splice(index, 1)
  return NextResponse.json({ data: { ...removed, recordType: removed.type } })
}
