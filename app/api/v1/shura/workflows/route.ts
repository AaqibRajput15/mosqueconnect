import { NextResponse } from 'next/server'
import { shuraWorkflowSchema } from './schema'
import { shuraRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'shura', action: 'read' })
  if ('error' in auth) return auth.error
  const data = await shuraRepository.list()
  const response = NextResponse.json({ data })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, { resource: 'shura', action: 'create' })
  if ('error' in auth) return auth.error
  const body = await request.json()
  const parsed = shuraWorkflowSchema.parse(body)
  const response = NextResponse.json({ data: parsed }, { status: 201 })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
