import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/server'
import { canAccessRoute } from '@/lib/auth/permissions'
import { canAccessPrivilegedRoute } from '@/lib/auth/email-verification-policy'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/unauthorized')
  if (!canAccessRoute(user.role, '/admin')) redirect('/forbidden')
  if (!canAccessPrivilegedRoute(user)) redirect('/forbidden')

  return <AdminShell>{children}</AdminShell>
}
