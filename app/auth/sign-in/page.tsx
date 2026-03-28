import { Suspense } from 'react'
import { SignInClient } from './sign-in-client'

export default function SignInPage() {
  return (
    <main className="container mx-auto max-w-md py-16">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-in form…</p>}>
        <SignInClient />
      </Suspense>
    </main>
  )
}
