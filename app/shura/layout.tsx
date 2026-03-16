import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/server'
import { canAccessRoute } from '@/lib/auth/permissions'
import { ShuraShell } from '@/components/shura/shura-shell'

export default async function ShuraLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/unauthorized')
  if (!canAccessRoute(user.role, '/shura')) redirect('/forbidden')

  return <ShuraShell>{children}</ShuraShell>
}
