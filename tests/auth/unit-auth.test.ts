import assert from 'node:assert/strict'
import test from 'node:test'
import { canAccessRoute, hasPermission } from '../../lib/auth/permissions'
import { createAuthToken, hashPassword, verifyPassword } from '../../lib/auth/utils'

test('auth token utility generates unique UUID-like token values', () => {
  const first = createAuthToken()
  const second = createAuthToken()

  assert.match(first, /^[a-f0-9-]{36}$/)
  assert.match(second, /^[a-f0-9-]{36}$/)
  assert.notEqual(first, second)
})

test('hashing utility hashes and verifies password values', () => {
  const hashed = hashPassword('StrongPassword123!')
  assert.equal(verifyPassword('StrongPassword123!', hashed), true)
  assert.equal(verifyPassword('WrongPassword123!', hashed), false)
})

test('policy checks enforce role-based permissions and route guards', () => {
  assert.equal(hasPermission('admin', 'finance:write'), true)
  assert.equal(hasPermission('member', 'finance:write'), false)
  assert.equal(canAccessRoute('admin', '/admin'), true)
  assert.equal(canAccessRoute('shura', '/shura'), true)
  assert.equal(canAccessRoute('member', '/shura'), false)
})
