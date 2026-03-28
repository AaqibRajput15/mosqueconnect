import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Microsoft OAuth sign-in has been removed. Use email/password sign-in.' }, { status: 410 })
}
