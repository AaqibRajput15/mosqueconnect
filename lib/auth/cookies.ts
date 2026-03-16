import type { NextResponse } from 'next/server'
import { AUTH_COOKIE } from './server'

const EIGHT_HOURS_SECONDS = 60 * 60 * 8

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
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain: getCookieDomain(),
    maxAge: EIGHT_HOURS_SECONDS,
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
