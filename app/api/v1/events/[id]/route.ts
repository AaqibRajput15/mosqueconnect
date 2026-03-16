import { NextResponse } from 'next/server'
import { createEventSchema } from '../schema'
import { eventRepository } from '@/lib/backend/repositories'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'events', action: 'read' })
  if ('error' in auth) return auth.error
  const { id } = await params
  const item = await eventRepository.getById(id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await eventRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'events',
    action: 'update',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const body = await request.json()
  const payload = createEventSchema.partial().parse(body)
  const updated = await eventRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await eventRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'events',
    action: 'delete',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const removed = await eventRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
