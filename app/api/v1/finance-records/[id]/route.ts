import { NextResponse } from 'next/server'
import { createFinanceRecordSchema } from '../schema'
import { financeRecordRepository } from '@/lib/backend/repositories'
import { setAuthCookie } from '@/lib/auth/cookies'
import { authorizeApiRequest } from '@/lib/auth/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await financeRecordRepository.getById(id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'finance',
    action: 'read',
    scope: { mosqueId: item.mosqueId },
  })
  if ('error' in auth) return auth.error

  const response = NextResponse.json({ data: { ...item, recordType: item.type } })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await financeRecordRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'finance',
    action: 'update',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const body = await request.json()
  const normalized = body.recordType && !body.type ? { ...body, type: body.recordType } : body
  const payload = createFinanceRecordSchema.partial().parse(normalized)
  const updated = await financeRecordRepository.update(id, payload)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json({ data: { ...updated, recordType: updated.type } })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await financeRecordRepository.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeApiRequest(request, {
    resource: 'finance',
    action: 'delete',
    scope: { mosqueId: existing.mosqueId },
  })
  if ('error' in auth) return auth.error

  const removed = await financeRecordRepository.remove(id)
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json({ data: { ...removed, recordType: removed.type } })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
