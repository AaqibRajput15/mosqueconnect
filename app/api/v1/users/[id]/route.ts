import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'
import { createUserSchema } from '../schema'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = appDataStore.users.find((user) => user.id === id)
  return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.users.findIndex((user) => user.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await request.json()
  const payload = createUserSchema.partial().parse(body)
  appDataStore.users[index] = { ...appDataStore.users[index], ...payload }
  return NextResponse.json({ data: appDataStore.users[index] })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const index = appDataStore.users.findIndex((user) => user.id === id)
  if (index < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = appDataStore.users.splice(index, 1)
  return NextResponse.json({ data: removed })
}
