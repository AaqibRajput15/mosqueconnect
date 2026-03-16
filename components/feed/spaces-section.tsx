"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Radio,
  Users,
  Calendar,
  Clock,
  Plus,
  Play,
  Square,
  ChevronRight,
  Volume2,
  VolumeX,
  Hand,
  LogOut,
  Settings,
  MoreHorizontal,
  Building2,
  CheckCircle,
  BookOpen,
  Shield,
  User,
  Circle,
  Download,
  Share2,
  Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFeedStore, type Space, type SpaceParticipant, currentUserProfile } from '@/lib/feed-store'

interface SpacesSectionProps {
  className?: string
  variant?: 'sidebar' | 'full'
}

export function SpacesSection({ className, variant = 'sidebar' }: SpacesSectionProps) {
  const { 
    spaces, 
    getLiveSpaces, 
    getScheduledSpaces, 
    createSpace, 
    joinSpace, 
    leaveSpace,
    startSpace,
    endSpace
  } = useFeedStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isSpaceRoomOpen, setIsSpaceRoomOpen] = useState(false)
  const [newSpace, setNewSpace] = useState({
    title: '',
    description: '',
    category: 'general' as Space['category'],
    scheduledStart: '',
    isRecorded: false
  })

  const liveSpaces = getLiveSpaces()
  const scheduledSpaces = getScheduledSpaces()

  const handleCreateSpace = () => {
    if (!newSpace.title.trim()) {
      toast.error('Please enter a title for your Space')
      return
    }

    const hostParticipant: SpaceParticipant = {
      id: currentUserProfile.id,
      name: currentUserProfile.name,
      username: currentUserProfile.username,
      avatar: currentUserProfile.avatar,
      role: 'host',
      isMuted: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString()
    }

    createSpace({
      title: newSpace.title,
      description: newSpace.description,
      hostId: currentUserProfile.id,
      host: hostParticipant,
      status: newSpace.scheduledStart ? 'scheduled' : 'live',
      scheduledStart: newSpace.scheduledStart || undefined,
      startedAt: newSpace.scheduledStart ? undefined : new Date().toISOString(),
      category: newSpace.category,
      isRecorded: newSpace.isRecorded
    })

    setNewSpace({
      title: '',
      description: '',
      category: 'general',
      scheduledStart: '',
      isRecorded: false
    })
    setIsCreateDialogOpen(false)
    toast.success(newSpace.scheduledStart ? 'Space scheduled!' : 'Space is now live!')
  }

  const handleJoinSpace = (space: Space) => {
    const participant: SpaceParticipant = {
      id: currentUserProfile.id,
      name: currentUserProfile.name,
      username: currentUserProfile.username,
      avatar: currentUserProfile.avatar,
      role: 'listener',
      isMuted: true,
      joinedAt: new Date().toISOString()
    }
    joinSpace(space.id, participant)
    setSelectedSpace(space)
    setIsSpaceRoomOpen(true)
    toast.success(`Joined "${space.title}"`)
  }

  const handleLeaveSpace = (spaceId: string) => {
    leaveSpace(spaceId, currentUserProfile.id)
    setSelectedSpace(null)
    setIsSpaceRoomOpen(false)
    toast.success('Left the Space')
  }

  const getCategoryColor = (category: Space['category']) => {
    switch (category) {
      case 'quran': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'islamic': return 'bg-primary/10 text-primary'
      case 'education': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'youth': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'sisters': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
      case 'community': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else {
      return 'Starting soon'
    }
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Live Spaces */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-rose-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="relative">
                  <Radio className="h-4 w-4 text-rose-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                Live Spaces
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-rose-500/10 text-rose-600">
                {liveSpaces.length} live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {liveSpaces.length === 0 ? (
              <div className="text-center py-4">
                <Radio className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">No live Spaces</p>
                <Button 
                  size="sm" 
                  className="mt-3 gap-1.5"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Start a Space
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {liveSpaces.slice(0, 3).map(space => (
                  <SpaceCard 
                    key={space.id} 
                    space={space}
                    onJoin={() => handleJoinSpace(space)}
                    getCategoryColor={getCategoryColor}
                    compact
                  />
                ))}
                {liveSpaces.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View all {liveSpaces.length} live Spaces
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Spaces */}
        {scheduledSpaces.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Spaces
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {scheduledSpaces.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {scheduledSpaces.slice(0, 2).map(space => (
                  <ScheduledSpaceCard 
                    key={space.id} 
                    space={space}
                    getCategoryColor={getCategoryColor}
                    formatScheduledTime={formatScheduledTime}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Space Button */}
        <Button 
          className="w-full gap-2" 
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Mic className="h-4 w-4" />
          Start a Space
        </Button>

        {/* Create Space Dialog */}
        <CreateSpaceDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          newSpace={newSpace}
          setNewSpace={setNewSpace}
          onSubmit={handleCreateSpace}
        />

        {/* Space Room Sheet */}
        {selectedSpace && (
          <SpaceRoom
            space={selectedSpace}
            isOpen={isSpaceRoomOpen}
            onClose={() => {
              handleLeaveSpace(selectedSpace.id)
            }}
            getCategoryColor={getCategoryColor}
          />
        )}
      </div>
    )
  }

  // Full variant for dedicated page
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Spaces</h2>
          <p className="text-muted-foreground">Live voice conversations with the community</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Start a Space
        </Button>
      </div>

      {/* Live Spaces */}
      {liveSpaces.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="relative">
              <Radio className="h-5 w-5 text-rose-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            Live Now
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveSpaces.map(space => (
              <SpaceCard 
                key={space.id} 
                space={space}
                onJoin={() => handleJoinSpace(space)}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Spaces */}
      {scheduledSpaces.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Spaces
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scheduledSpaces.map(space => (
              <ScheduledSpaceCard 
                key={space.id} 
                space={space}
                getCategoryColor={getCategoryColor}
                formatScheduledTime={formatScheduledTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveSpaces.length === 0 && scheduledSpaces.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Radio className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No Spaces Available</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Start a live Space to have voice conversations with your community members.
            </p>
            <Button 
              className="mt-6 gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Mic className="h-4 w-4" />
              Start Your First Space
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateSpaceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        newSpace={newSpace}
        setNewSpace={setNewSpace}
        onSubmit={handleCreateSpace}
      />

      {selectedSpace && (
        <SpaceRoom
          space={selectedSpace}
          isOpen={isSpaceRoomOpen}
          onClose={() => handleLeaveSpace(selectedSpace.id)}
          getCategoryColor={getCategoryColor}
        />
      )}
    </div>
  )
}

// Space Card Component
interface SpaceCardProps {
  space: Space
  onJoin: () => void
  getCategoryColor: (category: Space['category']) => string
  compact?: boolean
}

function SpaceCard({ space, onJoin, getCategoryColor, compact }: SpaceCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md cursor-pointer",
      "border-rose-200 dark:border-rose-900/50"
    )}>
      <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
                {space.category}
              </Badge>
              <Badge variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/50">
                LIVE
              </Badge>
            </div>
            <h4 className={cn("font-semibold truncate", compact ? "text-sm" : "text-base")}>
              {space.title}
            </h4>
            {!compact && space.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className={cn(compact ? "h-6 w-6" : "h-8 w-8")}>
            <AvatarImage src={space.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {space.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
              {space.host.name}
            </p>
            <p className="text-xs text-muted-foreground">Host</p>
          </div>
        </div>

        {/* Participants & Join */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{space.totalParticipants} listening</span>
          </div>
          <Button size="sm" onClick={onJoin} className="gap-1.5">
            <Volume2 className="h-3.5 w-3.5" />
            {compact ? 'Join' : 'Tune In'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Scheduled Space Card
interface ScheduledSpaceCardProps {
  space: Space
  getCategoryColor: (category: Space['category']) => string
  formatScheduledTime: (date: string) => string
}

function ScheduledSpaceCard({ space, getCategoryColor, formatScheduledTime }: ScheduledSpaceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
            {space.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatScheduledTime(space.scheduledStart!)}
          </Badge>
        </div>
        
        <h4 className="font-semibold text-sm truncate">{space.title}</h4>
        
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={space.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {space.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            Hosted by {space.host.name}
          </span>
        </div>

        {space.mosqueName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {space.mosqueName}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Set Reminder
        </Button>
      </CardContent>
    </Card>
  )
}

// Create Space Dialog
interface CreateSpaceDialogProps {
  isOpen: boolean
  onClose: () => void
  newSpace: {
    title: string
    description: string
    category: Space['category']
    scheduledStart: string
    isRecorded: boolean
  }
  setNewSpace: (space: typeof newSpace) => void
  onSubmit: () => void
}

function CreateSpaceDialog({ isOpen, onClose, newSpace, setNewSpace, onSubmit }: CreateSpaceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Start a Space
          </DialogTitle>
          <DialogDescription>
            Create a live voice room for the community to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Space Title *</label>
            <Input
              value={newSpace.title}
              onChange={(e) => setNewSpace({ ...newSpace, title: e.target.value })}
              placeholder="What's this Space about?"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={newSpace.description}
              onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
              placeholder="Add more details..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={newSpace.category}
              onValueChange={(v) => setNewSpace({ ...newSpace, category: v as Space['category'] })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="islamic">Islamic</SelectItem>
                <SelectItem value="quran">Quran & Tafseer</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="sisters">Sisters Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Schedule (Optional)</label>
            <Input
              type="datetime-local"
              value={newSpace.scheduledStart}
              onChange={(e) => setNewSpace({ ...newSpace, scheduledStart: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to start immediately
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} className="gap-2">
            {newSpace.scheduledStart ? (
              <>
                <Calendar className="h-4 w-4" />
                Schedule
              </>
            ) : (
              <>
                <Radio className="h-4 w-4" />
                Go Live
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Space Room (Live Room View)
interface SpaceRoomProps {
  space: Space
  isOpen: boolean
  onClose: () => void
  getCategoryColor: (category: Space['category']) => string
}

function SpaceRoom({ space, isOpen, onClose, getCategoryColor }: SpaceRoomProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [handRaised, setHandRaised] = useState(false)

  const allParticipants = [space.host, ...space.coHosts, ...space.speakers, ...space.listeners]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50">
                  LIVE
                </Badge>
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
                  {space.category}
                </Badge>
              </div>
              <SheetTitle className="text-left">{space.title}</SheetTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Space Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onClose}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Mosque Info */}
          {space.mosqueName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {space.mosqueName}
            </div>
          )}

          {/* Description */}
          {space.description && (
            <p className="text-sm text-muted-foreground">{space.description}</p>
          )}

          {/* Speakers Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Speakers</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Host */}
              <ParticipantAvatar 
                participant={space.host} 
                isHost 
                isSpeaking={space.host.isSpeaking}
              />
              
              {/* Co-hosts */}
              {space.coHosts.map(coHost => (
                <ParticipantAvatar 
                  key={coHost.id} 
                  participant={coHost}
                  isCoHost
                  isSpeaking={coHost.isSpeaking}
                />
              ))}
              
              {/* Speakers */}
              {space.speakers.map(speaker => (
                <ParticipantAvatar 
                  key={speaker.id} 
                  participant={speaker}
                  isSpeaking={speaker.isSpeaking}
                />
              ))}
            </div>
          </div>

          {/* Listeners */}
          {space.listeners.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Listeners ({space.listeners.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {space.listeners.slice(0, 12).map(listener => (
                  <Avatar key={listener.id} className="h-10 w-10">
                    <AvatarImage src={listener.avatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {listener.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {space.listeners.length > 12 && (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    +{space.listeners.length - 12}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Participants */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 border-t border-border">
            <Users className="h-4 w-4" />
            {space.totalParticipants} people in this Space
          </div>

          {/* Controls */}
          <div className="fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto p-4 bg-background border-t border-border sm:border-0 sm:p-0">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={handRaised ? "default" : "outline"}
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={() => {
                  setHandRaised(!handRaised)
                  toast.success(handRaised ? 'Hand lowered' : 'Hand raised - waiting for host approval')
                }}
              >
                <Hand className={cn("h-6 w-6", handRaised && "animate-bounce")} />
              </Button>

              <Button
                variant={isMuted ? "outline" : "default"}
                size="lg"
                className={cn(
                  "rounded-full h-16 w-16",
                  !isMuted && "bg-primary text-primary-foreground"
                )}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="h-7 w-7" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={onClose}
              >
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Participant Avatar Component
interface ParticipantAvatarProps {
  participant: SpaceParticipant
  isHost?: boolean
  isCoHost?: boolean
  isSpeaking?: boolean
}

function ParticipantAvatar({ participant, isHost, isCoHost, isSpeaking }: ParticipantAvatarProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <Avatar className={cn(
          "h-16 w-16 transition-all",
          isSpeaking && "ring-4 ring-primary/50 ring-offset-2"
        )}>
          <AvatarImage src={participant.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {participant.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicators */}
        <div className="absolute -bottom-1 -right-1">
          {participant.isMuted ? (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <MicOff className="h-3 w-3 text-muted-foreground" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <Mic className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs font-medium mt-2 truncate max-w-full">{participant.name}</p>
      <p className="text-xs text-muted-foreground">
        {isHost ? 'Host' : isCoHost ? 'Co-host' : 'Speaker'}
      </p>
    </div>
  )
}
