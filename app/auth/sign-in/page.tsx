"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { renderInlineAuthError, validateSignInForm } from '@/components/auth/auth-form-utils'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@mosqueconnect.org')
  const [password, setPassword] = useState('password123')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)
  const router = useRouter()

  const signIn = async () => {
    setError('')

    if (provider === 'google' || provider === 'microsoft') {
      window.location.href = `/api/auth/oauth/${provider}/start`
      return
    }

    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, provider }),
    })

    if (!response.ok) {
      setError('Unable to sign in with the selected provider/account.')
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

  const signInWithOAuth = async (provider: 'google' | 'microsoft') => {
    const emailError = validateSignInForm(email, 'oauth-placeholder')
    if (emailError) {
      setErrorCode(emailError)
      return
    }

    setErrorCode(null)
    setOauthLoading(provider)

    try {
      const response = await fetch(`/api/auth/oauth/${provider}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, intent: 'sign-in' }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setErrorCode(data.errorCode ?? 'unknown_error')
        return
      }

      router.push('/admin')
      router.refresh()
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use email/password or continue with your provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={isLoading || Boolean(oauthLoading)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              disabled={isLoading || Boolean(oauthLoading)}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {renderInlineAuthError(errorCode)}

          <Button className="w-full" onClick={signIn} disabled={isLoading || Boolean(oauthLoading)}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => signInWithOAuth('google')}
              disabled={isLoading || Boolean(oauthLoading)}
            >
              {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </Button>
            <Button
              variant="outline"
              onClick={() => signInWithOAuth('microsoft')}
              disabled={isLoading || Boolean(oauthLoading)}
            >
              {oauthLoading === 'microsoft' ? 'Connecting...' : 'Continue with Microsoft'}
            </Button>
          </div>

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
