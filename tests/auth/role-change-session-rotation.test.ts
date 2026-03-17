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

test('role changes invalidate existing target-user sessions immediately', async () => {
  const memberSignIn = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'member@example.org', provider: 'credentials' }),
  })
  assert.equal(memberSignIn.status, 200)
  const memberCookie = (memberSignIn.headers.get('set-cookie') ?? '').split(';')[0]

  const memberBefore = await fetch(`${server.baseUrl}/api/v1/mosques`, { headers: { cookie: memberCookie } })
  assert.equal(memberBefore.status, 200)

  const adminSignIn = await fetch(`${server.baseUrl}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mosqueconnect.org', provider: 'credentials' }),
  })
  assert.equal(adminSignIn.status, 200)
  const adminCookie = (adminSignIn.headers.get('set-cookie') ?? '').split(';')[0]

  const promoteMember = await fetch(`${server.baseUrl}/api/v1/users/user-3`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({ role: 'admin' }),
  })
  assert.equal(promoteMember.status, 200)

  const memberAfterPromotion = await fetch(`${server.baseUrl}/api/v1/mosques`, { headers: { cookie: memberCookie } })
  assert.equal(memberAfterPromotion.status, 401)

  const demoteAdmin = await fetch(`${server.baseUrl}/api/v1/users/user-1`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({ role: 'member' }),
  })
  assert.equal(demoteAdmin.status, 200)

  const adminAfterDemotion = await fetch(`${server.baseUrl}/api/v1/audit-logs`, { headers: { cookie: adminCookie } })
  assert.equal(adminAfterDemotion.status, 401)
})
