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

test('auth API routes: sign-up, sign-in, sign-out, session', async () => {
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
    body: JSON.stringify({ email: 'admin@mosqueconnect.org', password: 'password123' }),
  })
  assert.equal(signInResponse.status, 200)
  const signInCookie = (signInResponse.headers.get('set-cookie') ?? '').split(';')[0]
  assert.match(signInCookie, /mc_session=/)

  const sessionResponse = await fetch(`${server.baseUrl}/api/auth/session`, {
    headers: { cookie: signInCookie },
  })
  const sessionJson = await sessionResponse.json()
  assert.equal(sessionResponse.status, 200)
  assert.equal(sessionJson.user?.email, 'admin@mosqueconnect.org')

  const csrfResponse = await fetch(`${server.baseUrl}/api/auth/csrf`, {
    headers: { cookie: signInCookie },
  })
  const csrfBody = (await csrfResponse.json()) as { token: string }
  const csrfCookie = (csrfResponse.headers.get('set-cookie') ?? '').split(';')[0]
  const authAndCsrfCookie = `${signInCookie}; ${csrfCookie}`

  const signOutResponse = await fetch(`${server.baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { cookie: authAndCsrfCookie, 'x-csrf-token': csrfBody.token },
  })
  assert.equal(signOutResponse.status, 200)
  assert.match(signOutResponse.headers.get('set-cookie') ?? '', /mc_session=;/)
})
