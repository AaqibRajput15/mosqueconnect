import type { Announcement, Event, FinanceRecord, Mosque, User } from './types'
import { appDataStore, generateId, legacyCompatibility } from './server-data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const mosqueService = {
  list: () => clone(appDataStore.mosques),
  getById: (id: string) => clone(appDataStore.mosques.find((m) => m.id === id) ?? null),
  create: (payload: Omit<Mosque, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Mosque, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const mosque: Mosque = {
      ...payload,
      id: payload.id ?? generateId('mosque'),
      createdAt: payload.createdAt ?? new Date().toISOString(),
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    }
    appDataStore.mosques.push(mosque)
    return clone(mosque)
  },
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  },
  getNearby: (latitude: number, longitude: number, radiusKm = 10) =>
    clone(
      appDataStore.mosques.filter(
        (mosque) => mosqueService.calculateDistance(latitude, longitude, mosque.latitude, mosque.longitude) <= radiusKm,
      ),
    ),
}

export const eventService = {
  list: () => clone(appDataStore.events),
  getById: (id: string) => clone(appDataStore.events.find((e) => e.id === id) ?? null),
  listByMosqueId: (mosqueId: string) => clone(appDataStore.events.filter((event) => event.mosqueId === mosqueId)),
}

export const announcementService = {
  list: () => clone(appDataStore.announcements),
  listByMosqueId: (mosqueId: string) => clone(appDataStore.announcements.filter((announcement) => announcement.mosqueId === mosqueId)),
}

export const financeService = {
  list: () => clone(appDataStore.financeRecords),
  listWithLegacyFields: () => clone(appDataStore.financeRecords.map((record) => ({ ...record, recordType: record.type }))),
  listByMosqueId: (mosqueId: string) => clone(appDataStore.financeRecords.filter((record) => record.mosqueId === mosqueId)),
}

export const userService = {
  list: () => clone(appDataStore.users),
  create: (payload: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = { ...payload, id: generateId('user'), createdAt: new Date().toISOString() }
    appDataStore.users.push(user)
    return clone(user)
  },
}

export const shuraWorkflowService = {
  getAll: () => clone(appDataStore.shura),
}

export const legacyService = {
  donations: legacyCompatibility.donations,
  expenses: legacyCompatibility.expenses,
  donationGoals: legacyCompatibility.donationGoals,
  prayerTimes: legacyCompatibility.prayerTimes,
  imams: legacyCompatibility.imams,
  managementMembers: legacyCompatibility.managementMembers,
}

// Temporary compatibility exports while migrating from lib/mock-data.ts imports.
export const mockMosques = mosqueService.list()
export const mockEvents = eventService.list()
export const mockFinanceRecords = financeService.list()
export const mockDonationGoals = legacyService.donationGoals
export const mockAnnouncements = announcementService.list()
export const mosques = mockMosques
export const events = mockEvents
export const announcements = mockAnnouncements
export const donations = legacyService.donations
export const expenses = legacyService.expenses
export const donationGoals = legacyService.donationGoals
export const imams = legacyService.imams
export const managementMembers = legacyService.managementMembers

export const getMosqueById = (id: string) => mosqueService.getById(id) ?? undefined
export const getEventsByMosqueId = (mosqueId: string) => eventService.listByMosqueId(mosqueId)
export const getFinanceByMosqueId = (mosqueId: string) => financeService.listByMosqueId(mosqueId)
export const getAnnouncementsByMosqueId = (mosqueId: string) => announcementService.listByMosqueId(mosqueId)
export const getDonationGoalsByMosqueId = (mosqueId: string) => donationGoals.filter((goal) => goal.mosqueId === mosqueId)
export const getPrayerTimesByMosqueId = (mosqueId: string) => legacyService.prayerTimes.find((item) => item.mosqueId === mosqueId)
export const getImamsByMosqueId = (mosqueId: string) => legacyService.imams.filter((imam) => imam.mosqueId === mosqueId)
export const getImamById = (id: string) => legacyService.imams.find((imam) => imam.id === id)
export const getManagementByMosqueId = (mosqueId: string) => legacyService.managementMembers.filter((member) => member.mosqueId === mosqueId)
export const getManagementMemberById = (id: string) => legacyService.managementMembers.find((member) => member.id === id)
export const calculateDistance = mosqueService.calculateDistance
export const getNearbyMosques = mosqueService.getNearby
