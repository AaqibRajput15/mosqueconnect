import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createAnnouncementSchema } from '../schema'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = appDataStore.announcements.find((announcement) => announcement.id === id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.announcements.findIndex((announcement) => announcement.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const payload = createAnnouncementSchema.partial().parse(body)
  appDataStore.announcements[index] = { ...appDataStore.announcements[index], ...payload }
  return NextResponse.json({ data: appDataStore.announcements[index] })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.announcements.findIndex((announcement) => announcement.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = appDataStore.announcements.splice(index, 1)
  return NextResponse.json({ data: removed })
}
