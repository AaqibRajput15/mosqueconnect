import { createHash, randomBytes, randomUUID } from 'crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { appDataStore } from '@/lib/server-data'
import { supabaseRest } from '@/lib/backend/supabase-rest'

export type OneTimeTokenPurpose = 'verify_email' | 'reset_password'

interface OneTimeTokenRecord {
  id: string
  userId: string
  purpose: OneTimeTokenPurpose
  tokenHash: string
  expiresAt: string
  usedAt?: string | null
  createdAt: string
}

const fallbackTokens: OneTimeTokenRecord[] = []
const TOKEN_SPOOL_PATH = path.join(process.cwd(), '.tmp', 'one-time-token-spool.json')

const ONE_TIME_TOKEN_TABLE = 'auth_one_time_tokens'
const TOKEN_BYTE_LENGTH = 32

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function isExpired(record: Pick<OneTimeTokenRecord, 'expiresAt'>) {
  return new Date(record.expiresAt).getTime() <= Date.now()
}

async function readFallbackTokensFromDisk() {
  try {
    const raw = await fs.readFile(TOKEN_SPOOL_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as OneTimeTokenRecord[]) : []
  } catch {
    return []
  }
}

async function writeFallbackTokensToDisk(tokens: OneTimeTokenRecord[]) {
  await fs.mkdir(path.dirname(TOKEN_SPOOL_PATH), { recursive: true })
  await fs.writeFile(TOKEN_SPOOL_PATH, JSON.stringify(tokens), 'utf8')
}

async function withFallback<T>(handler: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!supabaseRest.enabled()) return fallback()
  try {
    return await handler()
  } catch {
    return fallback()
  }
}

export async function createOneTimeToken(input: {
  userId: string
  purpose: OneTimeTokenPurpose
  ttlMinutes: number
}) {
  const token = randomBytes(TOKEN_BYTE_LENGTH).toString('hex')
  const now = new Date()
  const record: OneTimeTokenRecord = {
    id: randomUUID(),
    userId: input.userId,
    purpose: input.purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + input.ttlMinutes * 60_000).toISOString(),
    usedAt: null,
    createdAt: now.toISOString(),
  }

  await withFallback(
    async () => {
      await supabaseRest.insert<OneTimeTokenRecord>(ONE_TIME_TOKEN_TABLE, record as unknown as Record<string, unknown>)
    },
    async () => {
      fallbackTokens.push(record)
      const diskTokens = await readFallbackTokensFromDisk()
      diskTokens.push(record)
      await writeFallbackTokensToDisk(diskTokens)
    },
  )

  return {
    token,
    expiresAt: record.expiresAt,
  }
}

export async function consumeOneTimeToken(input: { token: string; purpose: OneTimeTokenPurpose }) {
  const tokenHash = hashToken(input.token)

  const consumed = await withFallback<OneTimeTokenRecord | null>(
    async () => {
      const rows = await supabaseRest.list<OneTimeTokenRecord>(ONE_TIME_TOKEN_TABLE)
      const record = rows.find((row) => row.tokenHash === tokenHash && row.purpose === input.purpose)
      if (!record) return null
      if (record.usedAt || isExpired(record)) return null
      return supabaseRest.update<OneTimeTokenRecord>(ONE_TIME_TOKEN_TABLE, record.id, { usedAt: new Date().toISOString() })
    },
    async () => {
      const nowIso = new Date().toISOString()
      const memoryRecord = fallbackTokens.find((row) => row.tokenHash === tokenHash && row.purpose === input.purpose)
      if (memoryRecord && !memoryRecord.usedAt && !isExpired(memoryRecord)) {
        memoryRecord.usedAt = nowIso
      }

      const diskTokens = await readFallbackTokensFromDisk()
      const diskRecord = diskTokens.find((row) => row.tokenHash === tokenHash && row.purpose === input.purpose)
      if (diskRecord && !diskRecord.usedAt && !isExpired(diskRecord)) {
        diskRecord.usedAt = nowIso
        await writeFallbackTokensToDisk(diskTokens)
        return diskRecord
      }

      if (!memoryRecord || memoryRecord.usedAt || isExpired(memoryRecord)) return null
      return memoryRecord
    },
  )

  if (!consumed) return null
  return appDataStore.users.find((u) => u.id === consumed.userId) ?? null
}
