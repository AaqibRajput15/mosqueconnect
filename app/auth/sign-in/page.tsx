"use client"

import Link from 'next/link'
<<<<<<< HEAD
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@mosqueconnect.org')
  const [provider, setProvider] = useState<'credentials' | 'google' | 'microsoft'>('credentials')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const signIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
=======
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
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('switchAccount') !== '1') return

    const switchAccount = async () => {
      setIsSwitchingAccount(true)
      await fetch('/api/auth/sign-out', { method: 'POST' })
      setIsSwitchingAccount(false)
    }

    void switchAccount()
  }, [searchParams])

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

    try {
      const csrfToken = await fetchCsrfToken()
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
>>>>>>> main
        body: JSON.stringify({ email, provider }),
      })

      if (!response.ok) {
        setError('Unable to sign in with the selected provider/account.')
        return
      }

<<<<<<< HEAD
      const data = await response.json()
      router.push(data.redirectPath ?? '/')
=======
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Unable to sign in with the selected provider/account.')
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
>>>>>>> main
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

<<<<<<< HEAD
=======
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

  const signOutCurrentSession = async () => {
    setIsSwitchingAccount(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    setIsSwitchingAccount(false)
  }

>>>>>>> main
  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use an existing account with your auth provider.</CardDescription>
=======
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use email/password or continue with your provider.</CardDescription>
>>>>>>> main
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
<<<<<<< HEAD
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant={provider === 'credentials' ? 'default' : 'outline'} onClick={() => setProvider('credentials')}>Credentials</Button>
            <Button variant={provider === 'google' ? 'default' : 'outline'} onClick={() => setProvider('google')}>Google</Button>
            <Button variant={provider === 'microsoft' ? 'default' : 'outline'} onClick={() => setProvider('microsoft')}>Microsoft</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={signIn} disabled={isLoading}>{isLoading ? 'Signing in...' : 'Continue'}</Button>
          <p className="text-xs text-muted-foreground">Try: admin@mosqueconnect.org, shura@mosqueconnect.org, imam@alnoor.org, member@example.org</p>
          <p className="text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/auth/sign-up" className="underline">Create one</Link></p>
=======
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
>>>>>>> main
        </CardContent>
      </Card>
    </main>
  )
}
