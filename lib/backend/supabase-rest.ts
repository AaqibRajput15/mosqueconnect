import { backendConfig, isSupabaseEnabled } from './config'

const baseHeaders = () => ({
  apikey: backendConfig.serviceRoleKey as string,
  Authorization: `Bearer ${backendConfig.serviceRoleKey}`,
  'Content-Type': 'application/json',
})

const buildUrl = (table: string, query = '') => `${backendConfig.supabaseUrl}/rest/v1/${table}${query}`

const toQuery = (filters?: Record<string, string | number | boolean>) => {
  if (!filters) return ''
  const entries = Object.entries(filters)
  if (entries.length === 0) return ''
  const params = new URLSearchParams()
  for (const [key, value] of entries) {
    params.set(key, `eq.${value}`)
  }
  return `&${params.toString()}`
}

export const supabaseRest = {
  enabled: () => isSupabaseEnabled(),
  async list<T>(table: string): Promise<T[]> {
    const response = await fetch(buildUrl(table, '?select=*'), { headers: baseHeaders(), cache: 'no-store' })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  async find<T>(table: string, filters?: Record<string, string | number | boolean>): Promise<T[]> {
    const response = await fetch(buildUrl(table, `?select=*${toQuery(filters)}`), { headers: baseHeaders(), cache: 'no-store' })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  async findOne<T>(table: string, filters: Record<string, string | number | boolean>): Promise<T | null> {
    const response = await fetch(buildUrl(table, `?select=*&limit=1${toQuery(filters)}`), { headers: baseHeaders(), cache: 'no-store' })
    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as T[]
    return rows[0] ?? null
  },
  async getById<T>(table: string, id: string): Promise<T | null> {
    const response = await fetch(buildUrl(table, `?id=eq.${id}&select=*&limit=1`), { headers: baseHeaders(), cache: 'no-store' })
    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as T[]
    return rows[0] ?? null
  },
  async insert<T>(table: string, payload: Record<string, unknown>): Promise<T> {
    const response = await fetch(buildUrl(table), {
      method: 'POST',
      headers: { ...baseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as T[]
    return rows[0]
  },
  async update<T>(table: string, id: string, payload: Record<string, unknown>): Promise<T | null> {
    const response = await fetch(buildUrl(table, `?id=eq.${id}`), {
      method: 'PATCH',
      headers: { ...baseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as T[]
    return rows[0] ?? null
  },
  async updateWhere<T>(table: string, filters: Record<string, string | number | boolean>, payload: Record<string, unknown>): Promise<T[]> {
    const response = await fetch(buildUrl(table, `?${new URLSearchParams(
      Object.entries(filters).map(([key, value]) => [key, `eq.${value}`]),
    ).toString()}`), {
      method: 'PATCH',
      headers: { ...baseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
  async remove<T>(table: string, id: string): Promise<T | null> {
    const response = await fetch(buildUrl(table, `?id=eq.${id}`), {
      method: 'DELETE',
      headers: { ...baseHeaders(), Prefer: 'return=representation' },
    })
    if (!response.ok) throw new Error(await response.text())
    const rows = (await response.json()) as T[]
    return rows[0] ?? null
  },
  async removeWhere<T>(table: string, filters: Record<string, string | number | boolean>): Promise<T[]> {
    const response = await fetch(buildUrl(table, `?${new URLSearchParams(
      Object.entries(filters).map(([key, value]) => [key, `eq.${value}`]),
    ).toString()}`), {
      method: 'DELETE',
      headers: { ...baseHeaders(), Prefer: 'return=representation' },
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  },
}
