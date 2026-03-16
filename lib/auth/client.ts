export async function fetchCsrfToken() {
  const response = await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' })
  if (!response.ok) throw new Error('Unable to initialize secure form session')
  const payload = (await response.json()) as { token?: string }
  if (!payload.token) throw new Error('Missing CSRF token')
  return payload.token
}
