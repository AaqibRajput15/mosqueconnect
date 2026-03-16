import { NextResponse } from 'next/server'
import { createUserSchema } from '../schema'
import { userRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, 'users:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const { id } = await params
  const item = await userRepository.getById(id)
  const response = item ? NextResponse.json({ data: item }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ('rotatedToken' in auth && auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
<<<<<<< HEAD
  const auth = await requireApiPermission(request, 'users:write')
=======
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'update' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const { id } = await params
  const body = await request.json()
  const payload = createUserSchema.partial().parse(body)
  const existing = await userRepository.getById(id)
  const updated = await userRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (existing && payload.role && payload.role !== existing.role) {
    rotateSessionsForPrivilegeChange(updated.id)
  }

  const response = NextResponse.json({ data: updated })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
<<<<<<< HEAD
  const auth = await requireApiPermission(request, 'users:write')
=======
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'delete' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const { id } = await params
  const removed = await userRepository.remove(id)
  const response = removed ? NextResponse.json({ data: removed }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
