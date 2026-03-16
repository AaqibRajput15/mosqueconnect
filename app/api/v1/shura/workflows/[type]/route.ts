import { NextResponse } from 'next/server'
import { appDataStore } from '@/lib/server-data'

const allowed = ['members', 'visits', 'meetings', 'registrations', 'assessments', 'imamAppointments'] as const

type WorkflowType = typeof allowed[number]

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!allowed.includes(type as WorkflowType)) {
    return NextResponse.json({ error: 'Unsupported workflow type' }, { status: 400 })
  }

  return NextResponse.json({ data: appDataStore.shura[type as WorkflowType] })
}
