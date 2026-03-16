import { announcements, donationGoals, donations, events, expenses, imams, managementMembers, mockAnnouncements, mockEvents, mockFinanceRecords, mockMosques, mockPrayerTimes } from './mock-data'
import { imamAppointments, mosqueAssessments, mosqueRegistrations, mosqueVisits, shuraMeetings, shuraMembers } from './shura-mock-data'
import type { Announcement, AuthIdentity, Event, FinanceRecord, Mosque, MosqueAssessment, MosqueRegistration, MosqueVisit, ShuraMeeting, ShuraMember, User, ImamAppointment } from './types'

export interface AppDataStore {
  mosques: Mosque[]
  events: Event[]
  announcements: Announcement[]
  financeRecords: FinanceRecord[]
  users: User[]
  authIdentities: AuthIdentity[]
  shura: {
    members: ShuraMember[]
    visits: MosqueVisit[]
    meetings: ShuraMeeting[]
    registrations: MosqueRegistration[]
    assessments: MosqueAssessment[]
    imamAppointments: ImamAppointment[]
  }
}

const now = new Date().toISOString()

export const appDataStore: AppDataStore = {
  mosques: [...mockMosques],
  events: [...mockEvents],
  announcements: [...mockAnnouncements],
  financeRecords: [...mockFinanceRecords],
  users: [
<<<<<<< HEAD
    { id: 'user-1', email: 'admin@mosqueconnect.org', name: 'System Admin', role: 'admin', createdAt: now },
    { id: 'user-2', email: 'imam@alnoor.org', name: 'Imam Abdullah', role: 'mosque_admin', mosqueId: '1', createdAt: now },
    { id: 'user-3', email: 'member@example.org', name: 'Community Member', role: 'member', mosqueId: '2', createdAt: now },
    { id: 'user-4', email: 'shura@mosqueconnect.org', name: 'Shura Council Lead', role: 'shura', createdAt: now },
=======
    {
      id: 'user-1',
      email: 'admin@mosqueconnect.org',
      name: 'System Admin',
      role: 'admin',
      isActive: true,
      onboardingCompleted: true,
      defaultRedirectPath: '/dashboard/admin',
      createdAt: now,
    },
    {
      id: 'user-2',
      email: 'imam@alnoor.org',
      name: 'Imam Abdullah',
      role: 'mosque_admin',
      mosqueId: '1',
      isActive: true,
      onboardingCompleted: true,
      defaultRedirectPath: '/dashboard/mosque',
      createdAt: now,
    },
    {
      id: 'user-3',
      email: 'member@example.org',
      name: 'Community Member',
      role: 'member',
      mosqueId: '2',
      isActive: true,
      onboardingCompleted: false,
      defaultRedirectPath: '/dashboard/member',
      createdAt: now,
    },
    {
      id: 'user-4',
      email: 'shura@mosqueconnect.org',
      name: 'Shura Council Lead',
      role: 'shura',
      isActive: true,
      onboardingCompleted: true,
      defaultRedirectPath: '/dashboard/shura',
      createdAt: now,
    },
  ],
  authIdentities: [
    {
      id: 'identity-google-admin',
      provider: 'google',
      providerSubject: 'seed-google-admin',
      userId: 'user-1',
      email: 'admin@mosqueconnect.org',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'identity-microsoft-imam',
      provider: 'microsoft',
      providerSubject: 'seed-microsoft-imam',
      userId: 'user-2',
      email: 'imam@alnoor.org',
      createdAt: now,
      updatedAt: now,
    },
>>>>>>> main
  ],
  shura: {
    members: [...shuraMembers],
    visits: [...mosqueVisits],
    meetings: [...shuraMeetings],
    registrations: [...mosqueRegistrations],
    assessments: [...mosqueAssessments],
    imamAppointments: [...imamAppointments],
  }
}

export const legacyCompatibility = {
  donations,
  expenses,
  donationGoals,
  announcements,
  events,
  prayerTimes: mockPrayerTimes,
  imams,
  managementMembers,
}

export const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
