import { Suspense } from 'react'
import { ResetPasswordClient } from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading reset form…</p>}>
        <ResetPasswordClient />
      </Suspense>
    </main>
  )
}
