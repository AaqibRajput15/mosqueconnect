import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ComprehensiveFeed } from '@/components/feed/comprehensive-feed'
import { ProfileSection } from '@/components/feed/profile-section'
import { MembersSidebar } from '@/components/feed/members-sidebar'
import { TestAccountPanel } from '@/components/feed/user-switcher'
import { FeedMobileNav } from '@/components/feed/feed-mobile-nav'
import { Spinner } from '@/components/ui/spinner'
import { UserProvider } from '@/components/feed/user-switcher'

export const metadata = {
  title: 'Community Feed | MosqueConnect',
  description: 'Stay connected with your Muslim community. Share posts, join live Spaces, and video meetings with recording support.',
}

export default function FeedPage() {
  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar - Profile & Test Accounts */}
              <aside className="hidden lg:block lg:col-span-3 space-y-4">
                <div className="sticky top-20 space-y-4">
                  <Suspense fallback={<Spinner className="h-8 w-8 mx-auto" />}>
                    <ProfileSection isCurrentUser isCompact />
                  </Suspense>
                  <TestAccountPanel />
                </div>
              </aside>

              {/* Main Feed with Tabs */}
              <section className="lg:col-span-6">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-20">
                    <Spinner className="h-8 w-8" />
                  </div>
                }>
                  <ComprehensiveFeed />
                </Suspense>
              </section>

              {/* Right Sidebar - Members */}
              <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-20">
                  <Suspense fallback={<Spinner className="h-8 w-8 mx-auto" />}>
                    <MembersSidebar />
                  </Suspense>
                </div>
              </aside>
            </div>
          </div>
        </main>
        <Footer />
        
        {/* Mobile Navigation */}
        <FeedMobileNav />
      </div>
    </UserProvider>
  )
}
