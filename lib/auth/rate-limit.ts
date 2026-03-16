interface AttemptRecord {
  attempts: number[]
  lockUntil?: number
}

const MAX_ATTEMPTS_PER_WINDOW = 5
const WINDOW_MS = 1000 * 60 * 10
const LOCKOUT_MS = 1000 * 60 * 15

const attemptsByKey = new Map<string, AttemptRecord>()

function getOrCreateRecord(key: string) {
  const existing = attemptsByKey.get(key)
  if (existing) return existing
  const created: AttemptRecord = { attempts: [] }
  attemptsByKey.set(key, created)
  return created
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function getAuthRateLimitKey(request: Request, email: string) {
  return `${email.toLowerCase()}::${getClientIp(request)}`
}

export function isLockedOut(key: string) {
  const record = attemptsByKey.get(key)
  if (!record?.lockUntil) return false
  if (record.lockUntil <= Date.now()) {
    delete record.lockUntil
    return false
  }
  return true
}

export function registerAuthFailure(key: string) {
  const record = getOrCreateRecord(key)
  const now = Date.now()
  record.attempts = record.attempts.filter((attemptAt) => now - attemptAt <= WINDOW_MS)
  record.attempts.push(now)

  if (record.attempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    record.lockUntil = now + LOCKOUT_MS
  }
}

export function registerAuthSuccess(key: string) {
  attemptsByKey.delete(key)
}

export function getLockoutRetryAfterSeconds(key: string) {
  const lockUntil = attemptsByKey.get(key)?.lockUntil
  if (!lockUntil) return 0
  return Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000))
}
