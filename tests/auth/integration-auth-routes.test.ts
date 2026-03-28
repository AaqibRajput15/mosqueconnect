import assert from 'node:assert/strict'
import test, { after, before } from 'node:test'
import { createOneTimeToken } from '@/lib/auth/one-time-token-store'
import { clearSentAuthEmailsForTests, listSentAuthEmailsForTests } from '@/lib/auth/email-adapter'
import type { RunningServer } from './server-helper'
import { startNextServer, stopNextServer } from './server-helper'

let server: RunningServer

before(async () => {
  await clearSentAuthEmailsForTests()
  server = await startNextServer()
})

after(async () => {
  await stopNextServer(server)
})

test('auth API routes: sign-up, oauth callback, sign-out, session', async () => {
  const email = `integration-${Date.now()}@example.org`

  const signUpResponse = await fetch(`${server.baseUrl}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, name: 'Integration User', password: 'Password123!' }),
  })
  assert.equal(signUpResponse.status, 201)
  const signUpCookie = (signUpResponse.headers.get('set-cookie') ?? '').split(';')[0]
  assert.match(signUpCookie, /mc_session=/)

  const oauthResponse = await fetch(
    `${server.baseUrl}/api/auth/oauth/callback?provider=google&email=oauth-${Date.now()}@example.org&name=OAuth+User`,
    { redirect: 'manual' }
  )
  assert.equal(oauthResponse.status, 307)
  assert.match(oauthResponse.headers.get('location') ?? '', /\/admin$/)
  assert.match(oauthResponse.headers.get('set-cookie') ?? '', /mc_session=/)

  const sessionResponse = await fetch(`${server.baseUrl}/api/auth/session`, {
    headers: { cookie: signUpCookie },
  })
  const sessionJson = await sessionResponse.json()
  assert.equal(sessionResponse.status, 200)
  assert.equal(sessionJson.user?.email, email)

  const signOutResponse = await fetch(`${server.baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { cookie: signUpCookie },
  })
  assert.equal(signOutResponse.status, 200)
  assert.match(signOutResponse.headers.get('set-cookie') ?? '', /mc_session=;/)
})

test('password reset integration: valid reset, reused token rejection, session revocation, old/new password sign-in', async () => {
  await clearSentAuthEmailsForTests()
  const email = `reset-valid-${Date.now()}@example.org`
  const oldPassword = 'Password123!'
  const newPassword = 'BetterPassword123!'

  const signUpResponse = await fetch(`${server.baseUrl}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, name: 'Reset User', password: oldPassword }),
  })
  assert.equal(signUpResponse.status, 201)
  const preResetCookie = (signUpResponse.headers.get('set-cookie') ?? '').split(';')[0]

  const forgotPasswordResponse = await fetch(`${server.baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  assert.equal(forgotPasswordResponse.status, 200)
  assert.deepEqual(await forgotPasswordResponse.json(), { ok: true })

  const deliveries = await listSentAuthEmailsForTests()
  const resetEmail = deliveries.reverse().find((delivery) => delivery.type === 'reset_password' && delivery.email === email)
  assert.ok(resetEmail, 'expected a reset password delivery')

  const resetResponse = await fetch(`${server.baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: resetEmail?.token, newPassword }),
  })
  assert.equal(resetResponse.status, 200)

  const reuseResponse = await fetch(`${server.baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: resetEmail?.token, newPassword: `${newPassword}-alt` }),
  })
  assert.equal(reuseResponse.status, 400)

  const oldSessionResponse = await fetch(`${server.baseUrl}/api/auth/session`, {
    headers: { cookie: preResetCookie },
  })
  const oldSessionJson = await oldSessionResponse.json()
  assert.equal(oldSessionJson.user, null)

  const oldPasswordSignInResponse = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: oldPassword }),
  })
  assert.equal(oldPasswordSignInResponse.status, 401)

  const newPasswordSignInResponse = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword }),
  })
  assert.equal(newPasswordSignInResponse.status, 200)
})

test('password reset integration: expired token is rejected', async () => {
  const email = `reset-expired-${Date.now()}@example.org`

  const signUpResponse = await fetch(`${server.baseUrl}/api/auth/sign-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, name: 'Expired Reset User', password: 'Password123!' }),
  })
  assert.equal(signUpResponse.status, 201)
  const signUpJson = await signUpResponse.json()

  const tokenResult = await createOneTimeToken({
    userId: signUpJson.user.id,
    purpose: 'reset_password',
    ttlMinutes: -1,
  })

  const resetResponse = await fetch(`${server.baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: tokenResult.token, newPassword: 'AnotherPass123!' }),
  })
  assert.equal(resetResponse.status, 400)
})
