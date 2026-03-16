import type { Announcement, Event, FinanceRecord, Mosque, User } from '@/lib/types'
import { appDataStore, generateId } from '@/lib/server-data'
import { supabaseRest } from './supabase-rest'

type WorkflowType = 'members' | 'visits' | 'meetings' | 'registrations' | 'assessments' | 'imamAppointments'

const workflowTables: Record<WorkflowType, string> = {
  members: 'shura_members',
  visits: 'shura_visits',
  meetings: 'shura_meetings',
  registrations: 'shura_registrations',
  assessments: 'shura_assessments',
  imamAppointments: 'shura_imam_appointments',
}

async function withFallback<T>(handler: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!supabaseRest.enabled()) return fallback()
  try {
    return await handler()
  } catch {
    return fallback()
  }
}

function createCrudRepository<T extends { id: string }>(opts: {
  table: string
  listFallback: () => T[]
  getByIdFallback: (id: string) => T | null
  createFallback: (payload: Partial<T>) => T
  updateFallback: (id: string, payload: Partial<T>) => T | null
  deleteFallback: (id: string) => T | null
}) {
  return {
    list: () => withFallback<T[]>(() => supabaseRest.list<T>(opts.table), opts.listFallback),
    getById: (id: string) => withFallback<T | null>(() => supabaseRest.getById<T>(opts.table, id), () => opts.getByIdFallback(id)),
    create: (payload: Partial<T>) => withFallback<T>(() => supabaseRest.insert<T>(opts.table, payload), () => opts.createFallback(payload)),
    update: (id: string, payload: Partial<T>) =>
      withFallback<T | null>(() => supabaseRest.update<T>(opts.table, id, payload), () => opts.updateFallback(id, payload)),
    remove: (id: string) => withFallback<T | null>(() => supabaseRest.remove<T>(opts.table, id), () => opts.deleteFallback(id)),
  }
}

export const mosqueRepository = createCrudRepository<Mosque>({
  table: 'mosques',
  listFallback: () => appDataStore.mosques,
  getByIdFallback: (id) => appDataStore.mosques.find((m) => m.id === id) ?? null,
  createFallback: (payload) => {
    const row = { ...payload, id: generateId('mosque'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Mosque
    appDataStore.mosques.push(row)
    return row
  },
  updateFallback: (id, payload) => {
    const idx = appDataStore.mosques.findIndex((m) => m.id === id)
    if (idx < 0) return null
    appDataStore.mosques[idx] = { ...appDataStore.mosques[idx], ...payload, updatedAt: new Date().toISOString() }
    return appDataStore.mosques[idx]
  },
  deleteFallback: (id) => {
    const idx = appDataStore.mosques.findIndex((m) => m.id === id)
    if (idx < 0) return null
    return appDataStore.mosques.splice(idx, 1)[0]
  },
})

export const eventRepository = createCrudRepository<Event>({
  table: 'events',
  listFallback: () => appDataStore.events,
  getByIdFallback: (id) => appDataStore.events.find((e) => e.id === id) ?? null,
  createFallback: (payload) => {
    const row = { ...payload, id: generateId('event'), createdAt: new Date().toISOString() } as Event
    appDataStore.events.push(row)
    return row
  },
  updateFallback: (id, payload) => {
    const idx = appDataStore.events.findIndex((e) => e.id === id)
    if (idx < 0) return null
    appDataStore.events[idx] = { ...appDataStore.events[idx], ...payload }
    return appDataStore.events[idx]
  },
  deleteFallback: (id) => {
    const idx = appDataStore.events.findIndex((e) => e.id === id)
    if (idx < 0) return null
    return appDataStore.events.splice(idx, 1)[0]
  },
})

export const announcementRepository = createCrudRepository<Announcement>({
  table: 'announcements',
  listFallback: () => appDataStore.announcements,
  getByIdFallback: (id) => appDataStore.announcements.find((a) => a.id === id) ?? null,
  createFallback: (payload) => {
    const row = { ...payload, id: generateId('announcement'), createdAt: new Date().toISOString() } as Announcement
    appDataStore.announcements.push(row)
    return row
  },
  updateFallback: (id, payload) => {
    const idx = appDataStore.announcements.findIndex((a) => a.id === id)
    if (idx < 0) return null
    appDataStore.announcements[idx] = { ...appDataStore.announcements[idx], ...payload }
    return appDataStore.announcements[idx]
  },
  deleteFallback: (id) => {
    const idx = appDataStore.announcements.findIndex((a) => a.id === id)
    if (idx < 0) return null
    return appDataStore.announcements.splice(idx, 1)[0]
  },
})

export const financeRecordRepository = createCrudRepository<FinanceRecord>({
  table: 'finance_records',
  listFallback: () => appDataStore.financeRecords,
  getByIdFallback: (id) => appDataStore.financeRecords.find((f) => f.id === id) ?? null,
  createFallback: (payload) => {
    const row = { ...payload, id: generateId('finance'), createdAt: new Date().toISOString() } as FinanceRecord
    appDataStore.financeRecords.push(row)
    return row
  },
  updateFallback: (id, payload) => {
    const idx = appDataStore.financeRecords.findIndex((f) => f.id === id)
    if (idx < 0) return null
    appDataStore.financeRecords[idx] = { ...appDataStore.financeRecords[idx], ...payload }
    return appDataStore.financeRecords[idx]
  },
  deleteFallback: (id) => {
    const idx = appDataStore.financeRecords.findIndex((f) => f.id === id)
    if (idx < 0) return null
    return appDataStore.financeRecords.splice(idx, 1)[0]
  },
})

export const userRepository = createCrudRepository<User>({
  table: 'users',
  listFallback: () => appDataStore.users,
  getByIdFallback: (id) => appDataStore.users.find((u) => u.id === id) ?? null,
  createFallback: (payload) => {
    const row = { ...payload, id: generateId('user'), createdAt: new Date().toISOString() } as User
    appDataStore.users.push(row)
    return row
  },
  updateFallback: (id, payload) => {
    const idx = appDataStore.users.findIndex((u) => u.id === id)
    if (idx < 0) return null
    appDataStore.users[idx] = { ...appDataStore.users[idx], ...payload }
    return appDataStore.users[idx]
  },
  deleteFallback: (id) => {
    const idx = appDataStore.users.findIndex((u) => u.id === id)
    if (idx < 0) return null
    return appDataStore.users.splice(idx, 1)[0]
  },
})

export const shuraRepository = {
  list: () =>
    withFallback(
      () =>
        Promise.all(
          (Object.keys(workflowTables) as WorkflowType[]).map(async (key) => {
            const rows = await supabaseRest.list<{ id: string; payload?: unknown }>(workflowTables[key])
            return [key, rows.map((row) => row.payload ?? row)] as const
          }),
        ).then((rows) => Object.fromEntries(rows) as typeof appDataStore.shura),
      () => appDataStore.shura,
    ),
  listByType: (type: WorkflowType) =>
    withFallback(
      async () => {
        const rows = await supabaseRest.list<{ id: string; payload?: unknown }>(workflowTables[type])
        return rows.map((row) => row.payload ?? row)
      },
      () => appDataStore.shura[type],
    ),
}
