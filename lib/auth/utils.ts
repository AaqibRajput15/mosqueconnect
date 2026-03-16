import { randomUUID, scryptSync, timingSafeEqual } from 'crypto'

const SCRYPT_KEYLEN = 64

export function createAuthToken() {
  return randomUUID()
}

export function hashPassword(password: string) {
  const salt = randomUUID()
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, hashedPassword: string) {
  const [salt, storedHash] = hashedPassword.split(':')
  if (!salt || !storedHash) return false

  const derived = scryptSync(password, salt, SCRYPT_KEYLEN)
  const stored = Buffer.from(storedHash, 'hex')

  if (derived.length !== stored.length) return false
  return timingSafeEqual(derived, stored)
}
