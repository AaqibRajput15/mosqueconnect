import { NextResponse } from 'next/server'
import { userService } from '@/lib/services'
import { createUserSchema } from './schema'

export async function GET() {
  return NextResponse.json({ data: userService.list() })
}

export async function POST(request: Request) {
  const body = await request.json()
  const payload = createUserSchema.omit({ id: true, createdAt: true }).parse(body)
  return NextResponse.json({ data: userService.create(payload) }, { status: 201 })
}
