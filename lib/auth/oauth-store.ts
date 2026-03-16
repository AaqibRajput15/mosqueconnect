import { randomUUID } from 'crypto'
import type { AuthIdentity, User } from '@/lib/types'
import { appDataStore } from '@/lib/server-data'

export interface UpsertOAuthIdentityInput {
  provider: 'google' | 'microsoft'
  providerSubject: string
  email: string
  name?: string
}

export function upsertOAuthIdentity({ provider, providerSubject, email, name }: UpsertOAuthIdentityInput): User {
  const normalizedEmail = email.toLowerCase()
  const now = new Date().toISOString()

  let user = appDataStore.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail) ?? null
  if (!user) {
    user = {
      id: randomUUID(),
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail,
      role: 'member',
      createdAt: now,
    }
    appDataStore.users.push(user)
  }

  let identity = appDataStore.authIdentities.find((candidate) => candidate.provider === provider && candidate.providerSubject === providerSubject) ?? null

  if (!identity) {
    identity = {
      id: randomUUID(),
      provider,
      providerSubject,
      userId: user.id,
      email: normalizedEmail,
      createdAt: now,
      updatedAt: now,
    } satisfies AuthIdentity
    appDataStore.authIdentities.push(identity)
  } else {
    identity.userId = user.id
    identity.email = normalizedEmail
    identity.updatedAt = now
  }

  return user
}
