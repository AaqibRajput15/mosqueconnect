import { NextResponse } from 'next/server'
import { createUserSchema } from '../schema'
import { userRepository } from '@/lib/backend/repositories'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await userRepository.getById(id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const payload = createUserSchema.partial().parse(body)
  const updated = await userRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const removed = await userRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
