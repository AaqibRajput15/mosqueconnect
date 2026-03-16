import { NextResponse } from 'next/server'
import { createMosqueSchema } from './schema'
import { mosqueService } from '@/lib/services'

export async function GET() {
  return NextResponse.json({ data: mosqueService.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createMosqueSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body)
  return NextResponse.json({ data: mosqueService.create(payload) }, { status: 201 })
}
