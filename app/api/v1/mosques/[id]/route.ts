import { NextResponse } from 'next/server'
import { createMosqueSchema } from '../schema'
import { mosqueRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'read' })
  if ('error' in auth) return auth.error
  const { id } = await params
  const mosque = await mosqueRepository.getById(id)
  if (!mosque) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json({ data: mosque })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'update' })
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  const parsed = createMosqueSchema.partial().parse(body)
  const updated = await mosqueRepository.update(id, parsed)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json({ data: updated })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'delete' })
  if ('error' in auth) return auth.error
  const { id } = await params
  const removed = await mosqueRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json({ data: removed })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
