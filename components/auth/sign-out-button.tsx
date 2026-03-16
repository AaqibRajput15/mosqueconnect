"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    router.push('/auth/sign-in')
    router.refresh()
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
