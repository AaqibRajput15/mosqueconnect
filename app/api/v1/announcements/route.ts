import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from './schema'
import { announcementRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'announcements:read')
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await announcementRepository.list() })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'announcements:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createAnnouncementSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = await announcementRepository.create(payload)
  return NextResponse.json({ data: created }, { status: 201 })
}
