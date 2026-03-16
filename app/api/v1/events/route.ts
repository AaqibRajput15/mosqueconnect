import { NextResponse } from 'next/server'
import { appDataStore, generateId } from '@/lib/server-data'
import { createEventSchema } from './schema'

export async function GET() {
  return NextResponse.json({ data: appDataStore.events })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createEventSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = { ...payload, id: generateId('event'), createdAt: new Date().toISOString() }
  appDataStore.events.push(created)
  return NextResponse.json({ data: created }, { status: 201 })
}
