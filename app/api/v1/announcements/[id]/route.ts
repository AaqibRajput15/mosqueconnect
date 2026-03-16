import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from '../schema'
import { announcementRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'announcements:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'announcements', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const { id } = await params
  const item = await announcementRepository.getById(id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
  const { id } = await params
  const existing = await announcementRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'announcements',
    action: 'update',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const body = await request.json()
  const payload = createAnnouncementSchema.partial().parse(body)
  const updated = await announcementRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
<<<<<<< HEAD
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
=======
>>>>>>> main
  const { id } = await params
  const existing = await announcementRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'announcements',
    action: 'delete',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const removed = await announcementRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
