import { NextResponse } from 'next/server'
import { createUserSchema } from './schema'
import { userRepository } from '@/lib/backend/repositories'

export async function GET() {
  return NextResponse.json({ data: await userRepository.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createUserSchema.omit({ id: true, createdAt: true }).parse(body)
  return NextResponse.json({ data: await userRepository.create(payload) }, { status: 201 })
}
