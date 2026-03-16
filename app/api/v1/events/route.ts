import { NextResponse } from 'next/server'
import { createEventSchema } from './schema'
import { eventRepository } from '@/lib/backend/repositories'

export async function GET() {
  return NextResponse.json({ data: await eventRepository.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createEventSchema.omit({ id: true, createdAt: true }).parse(body)
  const created = await eventRepository.create(payload)
  return NextResponse.json({ data: created }, { status: 201 })
}
