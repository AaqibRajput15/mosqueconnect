import { Suspense } from 'react'
import { VerifyEmailClient } from './verify-email-client'

export default function VerifyEmailPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading verification form…</p>}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  )
}
