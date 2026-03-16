import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <main className="container mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Access denied</h1>
      <p className="text-muted-foreground">
        Your signed-in account does not have permission for this page. If you believe this is a mistake,
        contact support at{' '}
        <a className="underline" href="mailto:support@mosqueconnect.org">
          support@mosqueconnect.org
        </a>
        .
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/auth/sign-in?switchAccount=1">Switch account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  )
}
