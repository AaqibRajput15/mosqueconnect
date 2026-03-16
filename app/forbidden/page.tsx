import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <main className="container mx-auto max-w-xl py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Forbidden</h1>
      <p className="text-muted-foreground">Your current role does not have permission for this resource.</p>
      <Button asChild variant="outline">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  )
}
