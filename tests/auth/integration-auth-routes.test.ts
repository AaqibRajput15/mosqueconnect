import assert from 'node:assert/strict'
import test, { after, before } from 'node:test'
import type { RunningServer } from './server-helper'
import { startNextServer, stopNextServer } from './server-helper'

let server: RunningServer

before(async () => {
  server = await startNextServer()
})

after(async () => {
  await stopNextServer(server)
})

test('auth API routes: sign-up, sign-in, oauth callback, sign-out, session', async () => {
  const email = `integration-${Date.now()}@example.org`

  const signUpResponse = await fetch(`${server.baseUrl}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, name: 'Integration User', password: 'Password123!' }),
  })
  assert.equal(signUpResponse.status, 201)
  const signUpCookie = signUpResponse.headers.get('set-cookie') ?? ''
  assert.match(signUpCookie, /mc_session=/)

  const signInResponse = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mosqueconnect.org', provider: 'credentials' }),
  })
  assert.equal(signInResponse.status, 200)
  const signInCookie = (signInResponse.headers.get('set-cookie') ?? '').split(';')[0]
  assert.match(signInCookie, /mc_session=/)

  const oauthResponse = await fetch(
    `${server.baseUrl}/api/auth/oauth/callback?provider=google&email=oauth-${Date.now()}@example.org&name=OAuth+User`,
    { redirect: 'manual' }
  )
  assert.equal(oauthResponse.status, 307)
  assert.match(oauthResponse.headers.get('location') ?? '', /\/admin$/)
  assert.match(oauthResponse.headers.get('set-cookie') ?? '', /mc_session=/)

  const sessionResponse = await fetch(`${server.baseUrl}/api/auth/session`, {
    headers: { cookie: signInCookie },
  })
  const sessionJson = await sessionResponse.json()
  assert.equal(sessionResponse.status, 200)
  assert.equal(sessionJson.user?.email, 'admin@mosqueconnect.org')

  const signOutResponse = await fetch(`${server.baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { cookie: signInCookie },
  })
  assert.equal(signOutResponse.status, 200)
  assert.match(signOutResponse.headers.get('set-cookie') ?? '', /mc_session=;/)
})
