import { NextResponse } from 'next/server'
import { createMosqueSchema } from './schema'
import { mosqueRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'read' })
  if ('error' in auth) return auth.error
  const response = NextResponse.json({ data: await mosqueRepository.list() })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'mosques', action: 'create' })
  if ('error' in auth) return auth.error
  const body = await request.json()
  const payload = createMosqueSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body)
  const response = NextResponse.json({ data: await mosqueRepository.create(payload) }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
