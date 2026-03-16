import { NextResponse } from 'next/server'
import { shuraWorkflowSchema } from './schema'
import { shuraRepository } from '@/lib/backend/repositories'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'shura:read')
  if ('error' in auth) return auth.error
  const data = await shuraRepository.list()
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'shura:write')
  if ('error' in auth) return auth.error
  const body = await request.json()
  const parsed = shuraWorkflowSchema.parse(body)
  return NextResponse.json({ data: parsed }, { status: 201 })
}
