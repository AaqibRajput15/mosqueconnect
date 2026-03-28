import { NextResponse } from 'next/server'
import { clearAuthCookie, setAuthCookie } from '@/lib/auth/cookies'
import { requireApiPermission } from '@/lib/auth/server'

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'mosques:read')
  if ('error' in auth) {
    const response = NextResponse.json({ ok: true, user: null })
    clearAuthCookie(response)
    return response
  }

  const response = NextResponse.json({ ok: true, user: auth.user })
  if (auth.rotatedToken) setAuthCookie(response, auth.rotatedToken)
  return response
}
