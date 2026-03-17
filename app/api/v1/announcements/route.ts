import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from './schema'
import { announcementRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'announcements', action: 'read' })
  if ('error' in auth) return auth.error
  const response = NextResponse.json({ data: await announcementRepository.list() })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
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
  const response = NextResponse.json({ data: created }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
