import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { issueCsrfToken } from '@/lib/auth/csrf'

export async function GET() {
  const token = randomUUID()
  const response = NextResponse.json({ token })
  issueCsrfToken(response, token)
  return response
}
