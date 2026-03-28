"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { renderInlineAuthError, validateSignUpForm } from '@/components/auth/auth-form-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const [email, setEmail] = useState('new.member@example.org')
  const [password, setPassword] = useState('password123')
  const [confirmPassword, setConfirmPassword] = useState('password123')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const signUp = async () => {
    const formError = validateSignUpForm(email, password, confirmPassword)
    if (formError) {
      setErrorCode(formError)
      return
    }

    setErrorCode(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up', {
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

  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Create your account with email and password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              disabled={isLoading}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {renderInlineAuthError(errorCode)}

          <Button className="w-full" onClick={signUp} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline" href="/auth/sign-in">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
