import { NextResponse } from 'next/server'
import { createMosqueSchema } from '../schema'
import { mosqueRepository } from '@/lib/backend/repositories'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mosque = await mosqueRepository.getById(id)
  if (!mosque) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: mosque })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const parsed = createMosqueSchema.partial().parse(body)
  const updated = await mosqueRepository.update(id, parsed)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const removed = await mosqueRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: removed })
}
