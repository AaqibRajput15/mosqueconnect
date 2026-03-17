import { NextResponse } from 'next/server'
import { createEventSchema } from './schema'
import { eventRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'events', action: 'read' })
  if ('error' in auth) return auth.error
  const response = NextResponse.json({ data: await eventRepository.list() })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
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
  const response = NextResponse.json({ data: created }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
