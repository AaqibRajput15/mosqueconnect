"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [provider, setProvider] = useState<'credentials' | 'google' | 'microsoft'>('credentials')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const signUp = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, provider }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error ?? 'Unable to create your account.')
        return
      }

      const data = await response.json()
      router.push(data.redirectPath ?? '/')
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
        </CardContent>
      </Card>
    </main>
  )
}
