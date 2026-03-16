import { z } from 'zod'

export const mosqueSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string(),
  email: z.string().email(),
  website: z.string().optional(),
  description: z.string(),
  imageUrl: z.string(),
  facilities: z.array(z.string()),
  capacity: z.number(),
  establishedYear: z.number(),
  isVerified: z.boolean(),
  adminId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const eventSchema = z.object({
  id: z.string().optional(),
  mosqueId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  speaker: z.string().optional(),
  isRecurring: z.boolean(),
  recurrencePattern: z.string().optional(),
  maxAttendees: z.number().optional(),
  currentAttendees: z.number(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
})

export const announcementSchema = z.object({
  id: z.string().optional(),
  mosqueId: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.string(),
  isPinned: z.boolean(),
  publishDate: z.string(),
  expiryDate: z.string().optional(),
  authorName: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
})

export const financeRecordSchema = z.object({
  id: z.string().optional(),
  mosqueId: z.string(),
  type: z.enum(['donation', 'expense']),
  category: z.string(),
  amount: z.number(),
  description: z.string(),
  date: z.string(),
  donorName: z.string().optional(),
  isAnonymous: z.boolean(),
  receiptNumber: z.string().optional(),
  createdAt: z.string().optional(),
})

export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'mosque_admin', 'member', 'visitor']),
  mosqueId: z.string().optional(),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.string().optional(),
})

export const shuraWorkflowSchema = z.object({
  members: z.array(z.any()),
  visits: z.array(z.any()),
  meetings: z.array(z.any()),
  registrations: z.array(z.any()),
  assessments: z.array(z.any()),
  imamAppointments: z.array(z.any()),
})
