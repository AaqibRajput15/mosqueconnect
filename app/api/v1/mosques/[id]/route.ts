import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createMosqueSchema } from '../schema'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mosque = appDataStore.mosques.find((item) => item.id === id)
  if (!mosque) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: mosque })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = appDataStore.mosques.findIndex((item) => item.id === id)
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const parsed = createMosqueSchema.partial().parse(body)
  const updated = { ...appDataStore.mosques[idx], ...parsed, updatedAt: new Date().toISOString() }
  appDataStore.mosques[idx] = updated
  return NextResponse.json({ data: updated })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = appDataStore.mosques.findIndex((item) => item.id === id)
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = appDataStore.mosques.splice(idx, 1)
  return NextResponse.json({ data: removed })
}
