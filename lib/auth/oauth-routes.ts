import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/server'
import { createSessionForUserId } from '@/lib/auth/session-store'
import { upsertOAuthIdentity } from '@/lib/auth/oauth-store'
import {
  consumeOAuthState,
  createNonce,
  createPkceChallenge,
  createPkceVerifier,
  exchangeCodeForTokens,
  getOAuthProviderConfig,
  getRoleRedirect,
  storeOAuthState,
  verifyIdToken,
  type OAuthProvider,
} from '@/lib/auth/oauth'

function authFailure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function oauthStart(provider: OAuthProvider, request: Request) {
  const config = getOAuthProviderConfig(provider)
  if (!config) return authFailure(`OAuth is not configured for ${provider}.`, 503)

  const verifier = createPkceVerifier()
  const challenge = createPkceChallenge(verifier)
  const state = createNonce()
  const nonce = createNonce()

  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'

  await storeOAuthState({ provider, verifier, state, nonce, redirectTo, createdAt: Date.now() })

  const authorizationUrl = new URL(config.authorizationEndpoint)
  authorizationUrl.searchParams.set('client_id', config.clientId)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri)
  authorizationUrl.searchParams.set('scope', config.scope)
  authorizationUrl.searchParams.set('state', state)
  authorizationUrl.searchParams.set('nonce', nonce)
  authorizationUrl.searchParams.set('code_challenge', challenge)
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.redirect(authorizationUrl)
}

export async function oauthCallback(provider: OAuthProvider, request: Request) {
  const config = getOAuthProviderConfig(provider)
  if (!config) return authFailure(`OAuth is not configured for ${provider}.`, 503)

  const callbackUrl = new URL(request.url)
  const code = callbackUrl.searchParams.get('code')
  const state = callbackUrl.searchParams.get('state')
  const error = callbackUrl.searchParams.get('error')

  if (error) return authFailure(`OAuth error: ${error}`)

  const persistedState = await consumeOAuthState(provider)
  if (!persistedState || !state || persistedState.state !== state) {
    return authFailure('State validation failed.', 401)
  }

  if (!code) return authFailure('Missing authorization code.')

  try {
    const tokens = await exchangeCodeForTokens(config, code, persistedState.verifier)
    if (!tokens.id_token) return authFailure('Missing ID token from provider.', 401)

    const claims = await verifyIdToken(config, tokens.id_token, persistedState.nonce)
    const email = claims.email?.toLowerCase()

    if (!email) return authFailure('ID token did not include an email address.', 403)
    if (provider === 'google' && claims.email_verified === false) {
      return authFailure('Google account email is not verified.', 403)
    }

    const providerSubject = claims.sub
    if (!providerSubject) return authFailure('Missing subject in ID token.', 401)

    const user = upsertOAuthIdentity({
      provider,
      providerSubject,
      email,
      name: claims.name ?? claims.preferred_username ?? email,
    })

    const session = createSessionForUserId(user.id, provider)
    if (!session) return authFailure('Failed to create auth session.', 500)

    const response = NextResponse.redirect(new URL(getRoleRedirect(user.role), callbackUrl.origin))
    response.cookies.set(AUTH_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch {
    return authFailure('OAuth callback validation failed.', 401)
  }
}
