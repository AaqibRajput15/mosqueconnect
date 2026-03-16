import { NextResponse } from 'next/server'
import { createAnnouncementSchema } from './schema'
import { announcementRepository } from '@/lib/backend/repositories'

export async function GET() {
  return NextResponse.json({ data: await announcementRepository.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createAnnouncementSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = await announcementRepository.create(payload)
  return NextResponse.json({ data: created }, { status: 201 })
}
