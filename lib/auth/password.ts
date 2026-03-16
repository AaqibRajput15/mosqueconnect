import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const KEY_LENGTH = 64
const SCRYPT_COST = 1 << 15
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer

  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt.toString('hex')}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, costStr, blockSizeStr, parallelizationStr, saltHex, hashHex] = encodedHash.split('$')
  if (algorithm !== 'scrypt' || !costStr || !blockSizeStr || !parallelizationStr || !saltHex || !hashHex) {
    return false
  }

  const derived = (await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH)) as Buffer
  const stored = Buffer.from(hashHex, 'hex')

  if (stored.length !== derived.length) return false
  return timingSafeEqual(stored, derived)
}
