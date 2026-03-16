import { NextResponse } from 'next/server'
import { createMosqueSchema } from './schema'
import { mosqueRepository } from '@/lib/backend/repositories'

export async function GET() {
  return NextResponse.json({ data: await mosqueRepository.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createMosqueSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body)
  return NextResponse.json({ data: await mosqueRepository.create(payload) }, { status: 201 })
}
