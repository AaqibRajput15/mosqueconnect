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

test('guard redirects across /admin and /shura plus login/logout flow', async () => {
  const unauthAdmin = await fetch(`${server.baseUrl}/admin`, { redirect: 'manual' })
  assert.equal(unauthAdmin.status, 307)
  assert.equal(unauthAdmin.headers.get('location'), '/auth/sign-in')

  const unauthShura = await fetch(`${server.baseUrl}/shura`, { redirect: 'manual' })
  assert.equal(unauthShura.status, 307)
  assert.equal(unauthShura.headers.get('location'), '/auth/sign-in')

  const adminSignIn = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mosqueconnect.org', password: 'password123' }),
  })
  const adminCookie = (adminSignIn.headers.get('set-cookie') ?? '').split(';')[0]

  const adminPage = await fetch(`${server.baseUrl}/admin`, { headers: { cookie: adminCookie } })
  assert.equal(adminPage.status, 200)

  const shuraPageAsAdmin = await fetch(`${server.baseUrl}/shura`, { headers: { cookie: adminCookie } })
  assert.equal(shuraPageAsAdmin.status, 200)

  const csrfResponse = await fetch(`${server.baseUrl}/api/auth/csrf`, {
    headers: { cookie: adminCookie },
  })
  const csrfBody = (await csrfResponse.json()) as { token: string }
  const csrfCookie = (csrfResponse.headers.get('set-cookie') ?? '').split(';')[0]
  const authAndCsrfCookie = `${adminCookie}; ${csrfCookie}`

  await fetch(`${server.baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { cookie: authAndCsrfCookie, 'x-csrf-token': csrfBody.token },
  })

  const memberSignIn = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'member@example.org', password: 'password123' }),
  })
  assert.equal(memberSignIn.status, 200)
  const memberCookie = (memberSignIn.headers.get('set-cookie') ?? '').split(';')[0]

  const memberAdmin = await fetch(`${server.baseUrl}/admin`, { headers: { cookie: memberCookie }, redirect: 'manual' })
  assert.equal(memberAdmin.status, 307)
  assert.match(memberAdmin.headers.get('location') ?? '', /^\/(forbidden|unauthorized|auth\/sign-in)$/)

  const memberShura = await fetch(`${server.baseUrl}/shura`, { headers: { cookie: memberCookie }, redirect: 'manual' })
  assert.equal(memberShura.status, 307)
  assert.match(memberShura.headers.get('location') ?? '', /^\/(forbidden|unauthorized|auth\/sign-in)$/)
})
