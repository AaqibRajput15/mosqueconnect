import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <main className="container mx-auto max-w-xl py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="text-muted-foreground">You must sign in before accessing this section.</p>
      <Button asChild>
        <Link href="/auth/sign-in">Go to sign in</Link>
      </Button>
    </main>
  )
}
