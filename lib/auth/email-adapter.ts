import { promises as fs } from 'node:fs'
import path from 'node:path'
import { appDataStore } from '@/lib/server-data'

export type AuthEmailType = 'reset_password' | 'verify_email'

interface AuthEmailDelivery {
  type: AuthEmailType
  userId: string
  email: string
  token: string
  sentAt: string
}

const sentAuthEmails: AuthEmailDelivery[] = []
const EMAIL_SPOOL_PATH = path.join(process.cwd(), '.tmp', 'auth-email-spool.json')

async function writeSpoolFile(entries: AuthEmailDelivery[]) {
  await fs.mkdir(path.dirname(EMAIL_SPOOL_PATH), { recursive: true })
  await fs.writeFile(EMAIL_SPOOL_PATH, JSON.stringify(entries), 'utf8')
}

async function readSpoolFile() {
  try {
    const raw = await fs.readFile(EMAIL_SPOOL_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AuthEmailDelivery[]) : []
  } catch {
    return []
  }
}

async function queueAuthEmail(delivery: Omit<AuthEmailDelivery, 'sentAt'>) {
  const entry: AuthEmailDelivery = {
    ...delivery,
    sentAt: new Date().toISOString(),
  }

  sentAuthEmails.push(entry)
  const existing = await readSpoolFile()
  existing.push(entry)
  await writeSpoolFile(existing)
}

export async function sendResetPasswordEmail(input: { userId: string; token: string }) {
  const user = appDataStore.users.find((candidate) => candidate.id === input.userId)
  if (!user) return

  await queueAuthEmail({
    type: 'reset_password',
    userId: user.id,
    email: user.email,
    token: input.token,
  })
}

export async function sendVerifyEmailEmail(input: { userId: string; token: string }) {
  const user = appDataStore.users.find((candidate) => candidate.id === input.userId)
  if (!user) return

  await queueAuthEmail({
    type: 'verify_email',
    userId: user.id,
    email: user.email,
    token: input.token,
  })
}

export async function listSentAuthEmailsForTests() {
  const fileEntries = await readSpoolFile()
  return [...sentAuthEmails, ...fileEntries]
}

export async function clearSentAuthEmailsForTests() {
  sentAuthEmails.length = 0
  await writeSpoolFile([])
}
