import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      error: 'Legacy OAuth start endpoint has been removed. Use /api/auth/oauth/google/start or /api/auth/oauth/microsoft/start.',
    },
    { status: 410 },
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Legacy OAuth start endpoint has been removed. Use /api/auth/oauth/google/start or /api/auth/oauth/microsoft/start.',
    },
    { status: 410 },
  )
}
