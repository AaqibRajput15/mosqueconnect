import { NextResponse } from 'next/server'
import { createEventSchema } from '../schema'
import { eventRepository } from '@/lib/backend/repositories'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await eventRepository.getById(id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const payload = createEventSchema.partial().parse(body)
  const updated = await eventRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const removed = await eventRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
