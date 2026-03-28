import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const services = [
  {
    title: 'Mosque Directory',
    description: 'Find nearby mosques, leadership details, and contact information.',
    href: '/mosques',
    cta: 'Browse mosques',
  },
  {
    title: 'Events & Programs',
    description: 'Explore upcoming events, programs, and community activities.',
    href: '/events',
    cta: 'View events',
  },
  {
    title: 'Prayer Times',
    description: 'Check daily prayer times and related reminders.',
    href: '/prayer-times',
    cta: 'See prayer times',
  },
  {
    title: 'Community Feed',
    description: 'Read updates and announcements from the community.',
    href: '/feed',
    cta: 'Open feed',
  },
]

export default function PublicServicesPage() {
  return (
    <main className="container mx-auto max-w-5xl py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Public Services</h1>
        <p className="text-muted-foreground">
          Access essential community services, information, and resources.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.href}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={service.href}>{service.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
