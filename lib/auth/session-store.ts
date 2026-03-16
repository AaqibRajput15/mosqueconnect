import { createHash, randomBytes } from 'crypto'

import type { User } from '@/lib/types'
import { userRepository } from '@/lib/backend/repositories'
import { supabaseRest } from '@/lib/backend/supabase-rest'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

export interface SessionRecord {
  id: string
  user_id: string
  provider: string
  session_token_hash: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
  expires_at: string
  revoked_at: string | null
}

export interface SessionContext {
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
  ttlMs?: number
}

const hashSessionToken = (token: string) => createHash('sha256').update(token).digest('hex')
const generateSessionToken = () => randomBytes(48).toString('base64url')

const toDate = (value: string) => new Date(value)
const isExpired = (expiresAt: string) => toDate(expiresAt).getTime() <= Date.now()

async function cleanupExpiredSessions() {
  if (!supabaseRest.enabled()) return

  const sessions = await supabaseRest.list<SessionRecord>('auth_sessions').catch(() => [])
  const now = Date.now()

  for (const session of sessions) {
    if (!session.revoked_at && isExpired(session.expires_at)) {
      await supabaseRest.update<SessionRecord>('auth_sessions', session.id, { revoked_at: new Date(now).toISOString() }).catch(() => null)
    }
  }
}

export const sessionStore = {
  generateSessionToken,
  hashSessionToken,
  async createSession(userId: string, provider: string, rawSessionToken: string, context: SessionContext = {}) {
    if (!supabaseRest.enabled()) {
      throw new Error('Supabase must be configured for durable session storage')
    }

    await cleanupExpiredSessions()

    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + (context.ttlMs ?? SESSION_TTL_MS))

    return supabaseRest.insert<SessionRecord>('auth_sessions', {
      user_id: userId,
      provider,
      session_token_hash: hashSessionToken(rawSessionToken),
      ip_address: context.ipAddress ?? null,
      user_agent: context.userAgent ?? null,
      metadata: context.metadata ?? {},
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      revoked_at: null,
    })
  },
  async resolveSessionUser(rawSessionToken: string): Promise<User | null> {
    if (!supabaseRest.enabled()) return null

    await cleanupExpiredSessions()

    const record = await supabaseRest.findOne<SessionRecord>('auth_sessions', {
      session_token_hash: hashSessionToken(rawSessionToken),
    })

    if (!record) return null
    if (record.revoked_at || isExpired(record.expires_at)) {
      if (!record.revoked_at) {
        await supabaseRest.update<SessionRecord>('auth_sessions', record.id, { revoked_at: new Date().toISOString() }).catch(() => null)
      }
      return null
    }

    return userRepository.getById(record.user_id)
  },
  async revokeSession(rawSessionToken: string) {
    if (!supabaseRest.enabled()) return null

    const matching = await supabaseRest.findOne<SessionRecord>('auth_sessions', {
      session_token_hash: hashSessionToken(rawSessionToken),
    })

    if (!matching || matching.revoked_at) return matching

    return supabaseRest.update<SessionRecord>('auth_sessions', matching.id, {
      revoked_at: new Date().toISOString(),
    })
  },
  cleanupExpiredSessions,
}
