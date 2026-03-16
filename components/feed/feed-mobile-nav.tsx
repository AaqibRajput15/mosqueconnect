"use client"

import { useState } from 'react'
import {
  User,
  Radio,
  Users,
  Video,
  Rss,
  Home,
  Plus,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ProfileSection } from './profile-section'
import { MembersSidebar } from './members-sidebar'
import { SpacesSection } from './spaces-section'
import { VideoMeetingSection } from './video-meeting-section'
import { UserSwitcher, TestAccountPanel } from './user-switcher'

export function FeedMobileNav() {
  const [activeSheet, setActiveSheet] = useState<'profile' | 'spaces' | 'meetings' | 'members' | 'accounts' | null>(null)

  const navItems = [
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'spaces' as const, icon: Radio, label: 'Spaces', highlight: true },
    { id: 'meetings' as const, icon: Video, label: 'Meet', highlight: true },
    { id: 'members' as const, icon: Users, label: 'Members' },
    { id: 'accounts' as const, icon: Sparkles, label: 'Test', badge: true },
  ]

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSheet(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                item.highlight && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Sheet */}
      <Sheet open={activeSheet === 'profile'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>My Profile</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProfileSection isCurrentUser />
          </div>
        </SheetContent>
      </Sheet>

      {/* Spaces Sheet */}
      <Sheet open={activeSheet === 'spaces'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-rose-500" />
              Audio Spaces
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SpacesSection variant="full" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Video Meetings Sheet */}
      <Sheet open={activeSheet === 'meetings'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Video Meetings
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <VideoMeetingSection variant="full" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Members Sheet */}
      <Sheet open={activeSheet === 'members'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Members
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <MembersSidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Test Accounts Sheet */}
      <Sheet open={activeSheet === 'accounts'} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Test Accounts
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <UserSwitcher variant="inline" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
