"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@mosqueconnect.org')
  const [provider, setProvider] = useState<'credentials' | 'google' | 'microsoft'>('credentials')
  const [error, setError] = useState('')
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false)
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
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, provider }),
    })

    if (!response.ok) {
      setError('Unable to sign in with the selected provider/account.')
      return
    }

    const payload = (await response.json()) as { redirectTo?: string }
    router.push(payload.redirectTo ?? '/admin')
    router.refresh()
  }

  const signOutCurrentSession = async () => {
    setIsSwitchingAccount(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    setIsSwitchingAccount(false)
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
          <Button className="w-full" onClick={signIn}>Continue</Button>
          <Button className="w-full" variant="outline" onClick={signOutCurrentSession} disabled={isSwitchingAccount}>
            {isSwitchingAccount ? 'Switching account…' : 'Switch account'}
          </Button>
          <p className="text-xs text-muted-foreground">Try: admin@mosqueconnect.org, imam@alnoor.org, member@example.org</p>
        </CardContent>
      </Card>
    </main>
  )
}
