import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/server'
import { canAccessRoute } from '@/lib/auth/permissions'
<<<<<<< HEAD
=======
import { canAccessPrivilegedRoute } from '@/lib/auth/email-verification-policy'
>>>>>>> main
import { ShuraShell } from '@/components/shura/shura-shell'

export default async function ShuraLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/unauthorized')
  if (!canAccessRoute(user.role, '/shura')) redirect('/forbidden')
<<<<<<< HEAD
=======
  if (!canAccessPrivilegedRoute(user)) redirect('/forbidden')
>>>>>>> main

  return <ShuraShell>{children}</ShuraShell>
}
