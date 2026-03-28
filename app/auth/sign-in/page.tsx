"use client"

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { renderInlineAuthError, validateSignInForm } from '@/components/auth/auth-form-utils'
import { fetchCsrfToken } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@mosqueconnect.org')
  const [password, setPassword] = useState('password123')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('switchAccount') !== '1') return

    const switchAccount = async () => {
      setIsSwitchingAccount(true)
      const csrfToken = await fetchCsrfToken()
      await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'x-csrf-token': csrfToken } })
      setIsSwitchingAccount(false)
    }

    void switchAccount()
  }, [searchParams])

  const signIn = async () => {
    const formError = validateSignInForm(email, password)
    if (formError) {
      setErrorCode(formError)
      return
    }

    setErrorCode(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setErrorCode(data.errorCode ?? 'unknown_error')
        return
      }

      router.push('/admin')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const signOutCurrentSession = async () => {
    setIsSwitchingAccount(true)
    const csrfToken = await fetchCsrfToken()
    await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'x-csrf-token': csrfToken } })
    setIsSwitchingAccount(false)
  }

  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
          <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Sign in with your email and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSwitchingAccount ? (
            <p className="text-sm text-muted-foreground">Switching account…</p>
          ) : (
            <Button variant="outline" className="w-full" onClick={signOutCurrentSession}>
              Sign out current session
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={isLoading || isSwitchingAccount}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              disabled={isLoading || isSwitchingAccount}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {renderInlineAuthError(errorCode)}

          <Button
            className="w-full"
            onClick={signIn}
            disabled={isLoading || isSwitchingAccount}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <Link className="underline" href="/auth/sign-up">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
