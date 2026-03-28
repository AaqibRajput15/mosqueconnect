import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      error: 'OAuth sign-in endpoints have been removed. Use email/password authentication.',
    },
    { status: 410 },
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'OAuth sign-in endpoints have been removed. Use email/password authentication.',
    },
    { status: 410 },
  )
}
