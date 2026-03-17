import { NextResponse } from 'next/server'
import { createUserSchema } from './schema'
import { userRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'read' })
  if ('error' in auth) return auth.error
  const response = NextResponse.json({ data: await userRepository.list() })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'users', action: 'create' })
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createUserSchema.omit({ id: true, createdAt: true }).parse(body)
  const response = NextResponse.json({ data: await userRepository.create(payload) }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
