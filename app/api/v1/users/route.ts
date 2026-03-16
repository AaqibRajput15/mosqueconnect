import { NextResponse } from 'next/server'
import { createUserSchema } from './schema'
import { userRepository } from '@/lib/backend/repositories'
<<<<<<< HEAD
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'users:read')
=======
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'read' })
>>>>>>> main
  if ('error' in auth) return auth.error
  return NextResponse.json({ data: await userRepository.list() })
}

export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiPermission(request, 'users:write')
=======
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'create' })
>>>>>>> main
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createUserSchema.omit({ id: true, createdAt: true }).parse(body)
  return NextResponse.json({ data: await userRepository.create(payload) }, { status: 201 })
}
