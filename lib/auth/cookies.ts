import type { NextResponse } from 'next/server'
import { AUTH_COOKIE } from './server'

const FIFTEEN_MINUTES_SECONDS = 60 * 15

export interface SessionCookiePayload {
  accessToken: string
  refreshToken: string
  expiresAt: number
  issuedAt: number
}

function getCookieDomain() {
  if (process.env.NODE_ENV !== 'production') return undefined

  const configuredDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (configuredDomain) return configuredDomain

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return undefined

  try {
    return new URL(appUrl).hostname
  } catch {
    return undefined
  }
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain: getCookieDomain(),
    maxAge: FIFTEEN_MINUTES_SECONDS,
  }
}

export function serializeSessionCookie(session: SessionCookiePayload) {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
}

export function deserializeSessionCookie(value: string | undefined): SessionCookiePayload | null {
  if (!value) return null

  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<SessionCookiePayload>
    if (
      typeof payload.accessToken !== 'string' ||
      typeof payload.refreshToken !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      typeof payload.issuedAt !== 'number'
    ) {
      return null
    }

    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresAt,
      issuedAt: payload.issuedAt,
    }
  } catch {
    return null
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, getAuthCookieOptions())
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, '', {
    ...getAuthCookieOptions(),
    maxAge: 0,
  })
}
