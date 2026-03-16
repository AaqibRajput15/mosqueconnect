"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchCsrfToken } from '@/lib/auth/client'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      const csrfToken = await fetchCsrfToken()
      const allSessions = window.confirm('Sign out from all devices as well? Click Cancel to sign out only this device.')
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ allSessions }),
      })
    } finally {
      router.push('/auth/sign-in')
      router.refresh()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  )
}
