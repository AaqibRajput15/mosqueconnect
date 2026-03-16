import { NextResponse } from 'next/server'
import { shuraWorkflowSchema } from './schema'
import { shuraRepository } from '@/lib/backend/repositories'

export async function GET() {
  const data = await shuraRepository.list()
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = shuraWorkflowSchema.parse(body)
  return NextResponse.json({ data: parsed }, { status: 201 })
}
