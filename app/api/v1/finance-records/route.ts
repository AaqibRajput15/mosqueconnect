import { NextResponse } from 'next/server'
import { appDataStore, generateId } from '@/lib/server-data'
import { createFinanceRecordSchema } from './schema'

export async function GET() {
  const data = appDataStore.financeRecords.map((record) => ({ ...record, recordType: record.type }))
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createFinanceRecordSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = { ...payload, id: generateId('finance'), createdAt: new Date().toISOString() }
  appDataStore.financeRecords.push(created)
  return NextResponse.json({ data: { ...created, recordType: created.type } }, { status: 201 })
}
