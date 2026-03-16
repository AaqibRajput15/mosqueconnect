import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from './schema'
import { announcementRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'announcements:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'announcements', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await announcementRepository.list() })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createAnnouncementSchema.omit({ id: true, createdAt: true }).parse(body)

  const auth = await authorizeApiRequest(request, {
    resource: 'announcements',
    action: 'create',
    scope: { mosqueId: payload.mosqueId },
  })
  if ('error' in auth) return auth.error

  const created = await announcementRepository.create(
    auth.context.role === 'admin' ? payload : { ...payload, mosqueId: auth.context.scope.mosqueId ?? payload.mosqueId },
  )
  return NextResponse.json({ data: created }, { status: 201 })
}
