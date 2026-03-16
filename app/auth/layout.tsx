import { redirect } from 'next/navigation'
import { guardRouteAccess } from '@/lib/auth/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { redirectPath } = await guardRouteAccess('/auth/sign-in')
  if (redirectPath) {
    redirect(redirectPath)
  }

  return children
}
