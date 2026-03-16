"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@mosqueconnect.org')
  const [provider, setProvider] = useState<'credentials' | 'google' | 'microsoft'>('credentials')
  const [error, setError] = useState('')
  const router = useRouter()

  const signIn = async () => {
    setError('')
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, provider }),
    })

    if (!response.ok) {
      setError('Unable to sign in with the selected provider/account.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Use an existing seed account with your auth provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="flex justify-between text-xs">
            <Link className="text-primary hover:underline" href="/auth/forgot-password">Forgot password?</Link>
            <Link className="text-primary hover:underline" href="/auth/verify-email">Verify email</Link>
          </div>
          <Button className="w-full" onClick={signIn}>Continue</Button>
          <p className="text-xs text-muted-foreground">Try: admin@mosqueconnect.org, imam@alnoor.org, member@example.org</p>
        </CardContent>
      </Card>
    </main>
  )
}
