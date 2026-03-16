"use client"

import Link from 'next/link'
<<<<<<< HEAD
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
=======
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { renderInlineAuthError, validateEmail, validateSignUpForm } from '@/components/auth/auth-form-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
>>>>>>> main
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
<<<<<<< HEAD
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [provider, setProvider] = useState<'credentials' | 'google' | 'microsoft'>('credentials')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const signUp = async () => {
    setError('')
=======
  const [email, setEmail] = useState('new.member@example.org')
  const [password, setPassword] = useState('password123')
  const [confirmPassword, setConfirmPassword] = useState('password123')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null)
  const router = useRouter()

  const signUp = async () => {
    const formError = validateSignUpForm(email, password, confirmPassword)
    if (formError) {
      setErrorCode(formError)
      return
    }

    setErrorCode(null)
>>>>>>> main
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
        body: JSON.stringify({ name, email, provider }),
=======
        body: JSON.stringify({ email, password }),
>>>>>>> main
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
<<<<<<< HEAD
        setError(data.error ?? 'Unable to create your account.')
        return
      }

      const data = await response.json()
      router.push(data.redirectPath ?? '/')
=======
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
  const signUpWithOAuth = async (provider: 'google' | 'microsoft') => {
    const emailError = validateEmail(email)
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
        body: JSON.stringify({ email, intent: 'sign-up' }),
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

>>>>>>> main
  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
<<<<<<< HEAD
          <CardDescription>Register with your email and preferred auth provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant={provider === 'credentials' ? 'default' : 'outline'} onClick={() => setProvider('credentials')}>Credentials</Button>
            <Button variant={provider === 'google' ? 'default' : 'outline'} onClick={() => setProvider('google')}>Google</Button>
            <Button variant={provider === 'microsoft' ? 'default' : 'outline'} onClick={() => setProvider('microsoft')}>Microsoft</Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={signUp} disabled={isLoading || !name || !email}>{isLoading ? 'Creating account...' : 'Create account'}</Button>
          <p className="text-sm text-muted-foreground">Already have an account? <Link href="/auth/sign-in" className="underline">Sign in</Link></p>
=======
          <CardDescription>Sign up with email/password or use an OAuth provider.</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              disabled={isLoading || Boolean(oauthLoading)}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {renderInlineAuthError(errorCode)}

          <Button className="w-full" onClick={signUp} disabled={isLoading || Boolean(oauthLoading)}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => signUpWithOAuth('google')}
              disabled={isLoading || Boolean(oauthLoading)}
            >
              {oauthLoading === 'google' ? 'Connecting...' : 'Sign up with Google'}
            </Button>
            <Button
              variant="outline"
              onClick={() => signUpWithOAuth('microsoft')}
              disabled={isLoading || Boolean(oauthLoading)}
            >
              {oauthLoading === 'microsoft' ? 'Connecting...' : 'Sign up with Microsoft'}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline" href="/auth/sign-in">
              Sign in
            </Link>
          </p>
>>>>>>> main
        </CardContent>
      </Card>
    </main>
  )
}
