import { NextResponse } from 'next/server'
import { shuraRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

const allowed = ['members', 'visits', 'meetings', 'registrations', 'assessments', 'imamAppointments'] as const

type WorkflowType = (typeof allowed)[number]

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const auth = await authorizeApiRequest(request, { resource: 'shura', action: 'read' })
  if ('error' in auth) return auth.error

  const { type } = await params
  if (!allowed.includes(type as WorkflowType)) {
    const response = NextResponse.json({ error: 'Unsupported workflow type' }, { status: 400 })
    if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
    return response
  }

  const response = NextResponse.json({ data: await shuraRepository.listByType(type as WorkflowType) })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
