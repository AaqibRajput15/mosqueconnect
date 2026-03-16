import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from '../schema'
import { announcementRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'announcements:read')
  if ('error' in auth) return auth.error
  const { id } = await params
  const item = await announcementRepository.getById(id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  const payload = createAnnouncementSchema.partial().parse(body)
  const updated = await announcementRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
  const { id } = await params
  const removed = await announcementRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
