import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from '../schema'
import { announcementRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'announcements', action: 'read' })
  if ('error' in auth) return auth.error
  const { id } = await params
  const item = await announcementRepository.getById(id)
  const response = item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const response = NextResponse.json({ data: updated })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const response = NextResponse.json({ data: removed })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
