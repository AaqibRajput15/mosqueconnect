import { NextResponse } from 'next/server'
import { createMosqueSchema } from './schema'
import { mosqueRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'mosques:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await mosqueRepository.list() })
}

export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiPermission(request, 'mosques:write')
=======
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'create' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createMosqueSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body)
  return NextResponse.json({ data: await mosqueRepository.create(payload) }, { status: 201 })
}
