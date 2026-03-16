import { NextResponse } from 'next/server'
import { createEventSchema } from './schema'
import { eventRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'events:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'events', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await eventRepository.list() })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'events:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createEventSchema.omit({ id: true, createdAt: true }).parse(body)

  const auth = await authorizeApiRequest(request, {
    resource: 'events',
    action: 'create',
    scope: { mosqueId: payload.mosqueId },
  })
  if ('error' in auth) return auth.error

  const created = await eventRepository.create(
    auth.context.role === 'admin' ? payload : { ...payload, mosqueId: auth.context.scope.mosqueId ?? payload.mosqueId },
  )
  return NextResponse.json({ data: created }, { status: 201 })
}
