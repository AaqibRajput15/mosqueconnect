import { redirect } from 'next/navigation'
import { guardRouteAccess } from '@/lib/auth/server'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { redirectPath } = await guardRouteAccess('/admin')
  if (redirectPath) {
    redirect(redirectPath)
  }

  return <AdminShell>{children}</AdminShell>
}
