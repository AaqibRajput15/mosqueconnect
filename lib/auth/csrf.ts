import { randomUUID } from 'crypto'
import type { NextResponse } from 'next/server'

const CSRF_COOKIE = 'mc_csrf'

function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  }
}

export function issueCsrfToken(response: NextResponse, token = randomUUID()) {
  response.cookies.set(CSRF_COOKIE, token, getCsrfCookieOptions())
  return token
}

export function parseCookies(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [name, ...rest] = part.split('=')
      if (!name) return acc
      acc[name] = decodeURIComponent(rest.join('='))
      return acc
    }, {})
}

export function validateCsrfToken(request: Request) {
  const cookies = parseCookies(request)
  const cookieToken = cookies[CSRF_COOKIE]
  const headerToken = request.headers.get('x-csrf-token') ?? ''
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

export { CSRF_COOKIE }
