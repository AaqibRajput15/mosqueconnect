import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
<<<<<<< HEAD
    <main className="container mx-auto max-w-xl py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="text-muted-foreground">You must sign in before accessing this section.</p>
      <Button asChild>
        <Link href="/auth/sign-in">Go to sign in</Link>
      </Button>
=======
    <main className="container mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Sign in required</h1>
      <p className="text-muted-foreground">
        You need to sign in before accessing this section. Need help signing in? Contact{' '}
        <a className="underline" href="mailto:support@mosqueconnect.org">
          support@mosqueconnect.org
        </a>
        .
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/auth/sign-in">Go to sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/sign-in?switchAccount=1">Switch account</Link>
        </Button>
      </div>
>>>>>>> main
    </main>
  )
}
