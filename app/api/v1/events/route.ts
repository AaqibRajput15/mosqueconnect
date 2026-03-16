import { NextResponse } from 'next/server'
import { createEventSchema } from './schema'
import { eventRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'events:read')
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await eventRepository.list() })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'events:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createEventSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = await eventRepository.create(payload)
  return NextResponse.json({ data: created }, { status: 201 })
}
