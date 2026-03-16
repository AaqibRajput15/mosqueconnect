"use client"

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const queryToken = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const [token, setToken] = useState(queryToken)
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('')

  const requestVerification = async () => {
    setStatus('')
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    if (!response.ok) {
      setStatus(data.error ?? 'Unable to request a verification email.')
      return
    }

    setStatus(data.verificationUrl ? `Verification link: ${data.verificationUrl}` : 'If the account exists, a verification email has been sent.')
  }

  const verify = async () => {
    setStatus('')
    const response = await fetch('/api/auth/verify-email/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()
    if (!response.ok) {
      setStatus(data.error ?? 'Verification failed.')
      return
    }

    setStatus('Email verified successfully.')
  }

  return (
    <main className="container mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle>Verify email</CardTitle>
          <CardDescription>Request or consume a one-time verification token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <Button variant="outline" className="w-full" onClick={requestVerification}>Request verification link</Button>
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} />
          </div>
          <Button className="w-full" onClick={verify}>Verify email</Button>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>
    </main>
  )
}
