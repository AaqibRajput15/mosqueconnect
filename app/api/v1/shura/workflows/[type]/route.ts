import { NextResponse } from 'next/server'
import { shuraRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

const allowed = ['members', 'visits', 'meetings', 'registrations', 'assessments', 'imamAppointments'] as const

type WorkflowType = (typeof allowed)[number]

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const auth = await requireApiPermission(request, 'shura:read')
  if ('error' in auth) return auth.error

  const { type } = await params
  if (!allowed.includes(type as WorkflowType)) {
    return NextResponse.json({ error: 'Unsupported workflow type' }, { status: 400 })
  }

  return NextResponse.json({ data: await shuraRepository.listByType(type as WorkflowType) })
}
