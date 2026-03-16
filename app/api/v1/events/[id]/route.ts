import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createEventSchema } from '../schema'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = appDataStore.events.find((event) => event.id === id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.events.findIndex((event) => event.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const payload = createEventSchema.partial().parse(body)
  appDataStore.events[index] = { ...appDataStore.events[index], ...payload }
  return NextResponse.json({ data: appDataStore.events[index] })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.events.findIndex((event) => event.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = appDataStore.events.splice(index, 1)
  return NextResponse.json({ data: removed })
}
