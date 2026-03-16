import { NextResponse } from 'next/server'
import { appDataStore, generateId } from '@/lib/server-data'
import { createAnnouncementSchema } from './schema'

export async function GET() {
  return NextResponse.json({ data: appDataStore.announcements })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createAnnouncementSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = { ...payload, id: generateId('announcement'), createdAt: new Date().toISOString() }
  appDataStore.announcements.push(created)
  return NextResponse.json({ data: created }, { status: 201 })
}
