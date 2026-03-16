import { redirect } from 'next/navigation'
import { guardRouteAccess } from '@/lib/auth/server'
import { ShuraShell } from '@/components/shura/shura-shell'

export default async function ShuraLayout({ children }: { children: React.ReactNode }) {
  const { redirectPath } = await guardRouteAccess('/shura')
  if (redirectPath) {
    redirect(redirectPath)
  }

  return <ShuraShell>{children}</ShuraShell>
}
