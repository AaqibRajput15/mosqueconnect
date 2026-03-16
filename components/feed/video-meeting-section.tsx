"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  Calendar,
  Clock,
  Plus,
  Settings,
  MoreHorizontal,
  Copy,
  ChevronRight,
  Lock,
  Building2,
  Hand,
  MessageSquare,
  Circle,
  Square,
  Play,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  useFeedStore, 
  type VideoMeeting, 
  type MeetingParticipant,
  type Recording,
  currentUserProfile 
} from '@/lib/feed-store'

interface VideoMeetingSectionProps {
  className?: string
  variant?: 'sidebar' | 'full'
}

export function VideoMeetingSection({ className, variant = 'sidebar' }: VideoMeetingSectionProps) {
  const { 
    videoMeetings,
    getLiveMeetings, 
    getScheduledMeetings, 
    createMeeting,
    joinMeeting,
    leaveMeeting,
    startMeeting,
    endMeeting,
    getMeetingByCode
  } = useFeedStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<VideoMeeting | null>(null)
  const [isMeetingRoomOpen, setIsMeetingRoomOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    category: 'general' as VideoMeeting['category'],
    scheduledStart: '',
    password: '',
    settings: {
      allowScreenShare: true,
      allowChat: true,
      waitingRoom: false,
      muteOnEntry: true,
      allowRecording: true
    }
  })

  const liveMeetings = getLiveMeetings()
  const scheduledMeetings = getScheduledMeetings()

  const handleCreateMeeting = () => {
    if (!newMeeting.title.trim()) {
      toast.error('Please enter a title for your meeting')
      return
    }

    const hostParticipant: MeetingParticipant = {
      id: currentUserProfile.id,
      name: currentUserProfile.name,
      username: currentUserProfile.username,
      avatar: currentUserProfile.avatar,
      role: 'host',
      isMuted: false,
      isVideoOn: true,
      joinedAt: new Date().toISOString()
    }

    const meetingCode = createMeeting({
      title: newMeeting.title,
      description: newMeeting.description,
      hostId: currentUserProfile.id,
      host: hostParticipant,
      status: newMeeting.scheduledStart ? 'scheduled' : 'live',
      scheduledStart: newMeeting.scheduledStart || undefined,
      startedAt: newMeeting.scheduledStart ? undefined : new Date().toISOString(),
      category: newMeeting.category,
      password: newMeeting.password || undefined,
      settings: newMeeting.settings,
      isRecorded: newMeeting.settings.allowRecording
    })

    setNewMeeting({
      title: '',
      description: '',
      category: 'general',
      scheduledStart: '',
      password: '',
      settings: {
        allowScreenShare: true,
        allowChat: true,
        waitingRoom: false,
        muteOnEntry: true,
        allowRecording: true
      }
    })
    setIsCreateDialogOpen(false)
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span>{newMeeting.scheduledStart ? 'Meeting scheduled!' : 'Meeting started!'}</span>
        <span className="text-xs text-muted-foreground">Code: {meetingCode}</span>
      </div>
    )
  }

  const handleJoinWithCode = () => {
    const meeting = getMeetingByCode(joinCode.toUpperCase())
    if (!meeting) {
      toast.error('Meeting not found. Please check the code.')
      return
    }
    if (meeting.password && meeting.password !== joinPassword) {
      toast.error('Incorrect password')
      return
    }
    handleJoinMeeting(meeting)
    setIsJoinDialogOpen(false)
    setJoinCode('')
    setJoinPassword('')
  }

  const handleJoinMeeting = (meeting: VideoMeeting) => {
    const participant: MeetingParticipant = {
      id: currentUserProfile.id,
      name: currentUserProfile.name,
      username: currentUserProfile.username,
      avatar: currentUserProfile.avatar,
      role: 'participant',
      isMuted: meeting.settings.muteOnEntry,
      isVideoOn: true,
      joinedAt: new Date().toISOString()
    }
    joinMeeting(meeting.id, participant)
    setSelectedMeeting(meeting)
    setIsMeetingRoomOpen(true)
    toast.success(`Joined "${meeting.title}"`)
  }

  const handleLeaveMeeting = (meetingId: string) => {
    leaveMeeting(meetingId, currentUserProfile.id)
    setSelectedMeeting(null)
    setIsMeetingRoomOpen(false)
    toast.success('Left the meeting')
  }

  const getCategoryColor = (category: VideoMeeting['category']) => {
    switch (category) {
      case 'quran': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'islamic': return 'bg-primary/10 text-primary'
      case 'education': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'youth': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'sisters': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
      case 'community': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'meeting': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
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
        {/* Live Meetings */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="relative">
                  <Video className="h-4 w-4 text-blue-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                Live Meetings
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                {liveMeetings.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {liveMeetings.length === 0 ? (
              <div className="text-center py-4">
                <Video className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">No active meetings</p>
                <div className="flex flex-col gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Start Meeting
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setIsJoinDialogOpen(true)}
                  >
                    <Users className="h-4 w-4" />
                    Join with Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {liveMeetings.slice(0, 2).map(meeting => (
                  <MeetingCard 
                    key={meeting.id} 
                    meeting={meeting}
                    onJoin={() => handleJoinMeeting(meeting)}
                    getCategoryColor={getCategoryColor}
                    compact
                  />
                ))}
                {liveMeetings.length > 2 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View all {liveMeetings.length} meetings
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Meetings */}
        {scheduledMeetings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {scheduledMeetings.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {scheduledMeetings.slice(0, 2).map(meeting => (
                  <ScheduledMeetingCard 
                    key={meeting.id} 
                    meeting={meeting}
                    getCategoryColor={getCategoryColor}
                    formatScheduledTime={formatScheduledTime}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            className="gap-2" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Video className="h-4 w-4" />
            New Meet
          </Button>
          <Button 
            variant="outline"
            className="gap-2" 
            onClick={() => setIsJoinDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
            Join
          </Button>
        </div>

        {/* Dialogs */}
        <CreateMeetingDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          newMeeting={newMeeting}
          setNewMeeting={setNewMeeting}
          onSubmit={handleCreateMeeting}
        />

        <JoinMeetingDialog
          isOpen={isJoinDialogOpen}
          onClose={() => setIsJoinDialogOpen(false)}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          joinPassword={joinPassword}
          setJoinPassword={setJoinPassword}
          onJoin={handleJoinWithCode}
        />

        {selectedMeeting && (
          <MeetingRoom
            meeting={selectedMeeting}
            isOpen={isMeetingRoomOpen}
            onClose={() => handleLeaveMeeting(selectedMeeting.id)}
            getCategoryColor={getCategoryColor}
          />
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Meetings</h2>
          <p className="text-muted-foreground">Connect face-to-face with your community</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
            <Users className="h-4 w-4" />
            Join with Code
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Live Meetings */}
      {liveMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="relative">
              <Video className="h-5 w-5 text-blue-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            Active Meetings
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveMeetings.map(meeting => (
              <MeetingCard 
                key={meeting.id} 
                meeting={meeting}
                onJoin={() => handleJoinMeeting(meeting)}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Meetings */}
      {scheduledMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Meetings
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scheduledMeetings.map(meeting => (
              <ScheduledMeetingCard 
                key={meeting.id} 
                meeting={meeting}
                getCategoryColor={getCategoryColor}
                formatScheduledTime={formatScheduledTime}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveMeetings.length === 0 && scheduledMeetings.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Video className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No Meetings Available</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Start a video meeting to connect face-to-face with your community members.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Video className="h-4 w-4" />
                Start Your First Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateMeetingDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        newMeeting={newMeeting}
        setNewMeeting={setNewMeeting}
        onSubmit={handleCreateMeeting}
      />

      <JoinMeetingDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        joinPassword={joinPassword}
        setJoinPassword={setJoinPassword}
        onJoin={handleJoinWithCode}
      />

      {selectedMeeting && (
        <MeetingRoom
          meeting={selectedMeeting}
          isOpen={isMeetingRoomOpen}
          onClose={() => handleLeaveMeeting(selectedMeeting.id)}
          getCategoryColor={getCategoryColor}
        />
      )}
    </div>
  )
}

// Meeting Card Component
interface MeetingCardProps {
  meeting: VideoMeeting
  onJoin: () => void
  getCategoryColor: (category: VideoMeeting['category']) => string
  compact?: boolean
}

function MeetingCard({ meeting, onJoin, getCategoryColor, compact }: MeetingCardProps) {
  const copyMeetingCode = () => {
    navigator.clipboard.writeText(meeting.meetingCode)
    toast.success('Meeting code copied!')
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      "border-blue-200 dark:border-blue-900/50"
    )}>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
                {meeting.category}
              </Badge>
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/50">
                LIVE
              </Badge>
              {meeting.isRecorded && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                  <Circle className="h-2 w-2 mr-1 fill-red-500 text-red-500 animate-pulse" />
                  REC
                </Badge>
              )}
            </div>
            <h4 className={cn("font-semibold truncate", compact ? "text-sm" : "text-base")}>
              {meeting.title}
            </h4>
            {!compact && meeting.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className={cn(compact ? "h-6 w-6" : "h-8 w-8")}>
            <AvatarImage src={meeting.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {meeting.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
              {meeting.host.name}
            </p>
            <p className="text-xs text-muted-foreground">Host</p>
          </div>
        </div>

        {/* Meeting Code */}
        <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-md">
          <code className="text-xs font-mono flex-1">{meeting.meetingCode}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyMeetingCode}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Participants & Join */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{meeting.totalParticipants} in meeting</span>
          </div>
          <Button size="sm" onClick={onJoin} className="gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {compact ? 'Join' : 'Join Meeting'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Scheduled Meeting Card
interface ScheduledMeetingCardProps {
  meeting: VideoMeeting
  getCategoryColor: (category: VideoMeeting['category']) => string
  formatScheduledTime: (date: string) => string
}

function ScheduledMeetingCard({ meeting, getCategoryColor, formatScheduledTime }: ScheduledMeetingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
            {meeting.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatScheduledTime(meeting.scheduledStart!)}
          </Badge>
          {meeting.password && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3" />
            </Badge>
          )}
        </div>
        
        <h4 className="font-semibold text-sm truncate">{meeting.title}</h4>
        
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={meeting.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {meeting.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            Hosted by {meeting.host.name}
          </span>
        </div>

        {meeting.mosqueName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {meeting.mosqueName}
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

// Create Meeting Dialog
interface CreateMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
  newMeeting: {
    title: string
    description: string
    category: VideoMeeting['category']
    scheduledStart: string
    password: string
    settings: VideoMeeting['settings']
  }
  setNewMeeting: (meeting: typeof newMeeting) => void
  onSubmit: () => void
}

function CreateMeetingDialog({ isOpen, onClose, newMeeting, setNewMeeting, onSubmit }: CreateMeetingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Create Video Meeting
          </DialogTitle>
          <DialogDescription>
            Start or schedule a video meeting for the community
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <Label>Meeting Title *</Label>
              <Input
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                placeholder="What's this meeting about?"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                placeholder="Add meeting agenda or details..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={newMeeting.category}
                onValueChange={(v) => setNewMeeting({ ...newMeeting, category: v as VideoMeeting['category'] })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="meeting">Board Meeting</SelectItem>
                  <SelectItem value="islamic">Islamic</SelectItem>
                  <SelectItem value="quran">Quran Class</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="sisters">Sisters Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={newMeeting.scheduledStart}
                onChange={(e) => setNewMeeting({ ...newMeeting, scheduledStart: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to start immediately
              </p>
            </div>

            <div>
              <Label>Meeting Password (Optional)</Label>
              <Input
                type="password"
                value={newMeeting.password}
                onChange={(e) => setNewMeeting({ ...newMeeting, password: e.target.value })}
                placeholder="Add a password for extra security"
                className="mt-1.5"
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Screen Sharing</Label>
                <p className="text-xs text-muted-foreground">Participants can share their screen</p>
              </div>
              <Switch
                checked={newMeeting.settings.allowScreenShare}
                onCheckedChange={(v) => setNewMeeting({
                  ...newMeeting,
                  settings: { ...newMeeting.settings, allowScreenShare: v }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Chat</Label>
                <p className="text-xs text-muted-foreground">Allow text chat during meeting</p>
              </div>
              <Switch
                checked={newMeeting.settings.allowChat}
                onCheckedChange={(v) => setNewMeeting({
                  ...newMeeting,
                  settings: { ...newMeeting.settings, allowChat: v }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Waiting Room</Label>
                <p className="text-xs text-muted-foreground">Approve participants before they join</p>
              </div>
              <Switch
                checked={newMeeting.settings.waitingRoom}
                onCheckedChange={(v) => setNewMeeting({
                  ...newMeeting,
                  settings: { ...newMeeting.settings, waitingRoom: v }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mute on Entry</Label>
                <p className="text-xs text-muted-foreground">Mute participants when they join</p>
              </div>
              <Switch
                checked={newMeeting.settings.muteOnEntry}
                onCheckedChange={(v) => setNewMeeting({
                  ...newMeeting,
                  settings: { ...newMeeting.settings, muteOnEntry: v }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Recording</Label>
                <p className="text-xs text-muted-foreground">Enable meeting recording</p>
              </div>
              <Switch
                checked={newMeeting.settings.allowRecording}
                onCheckedChange={(v) => setNewMeeting({
                  ...newMeeting,
                  settings: { ...newMeeting.settings, allowRecording: v }
                })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} className="gap-2">
            {newMeeting.scheduledStart ? (
              <>
                <Calendar className="h-4 w-4" />
                Schedule
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Start Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Join Meeting Dialog
interface JoinMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
  joinCode: string
  setJoinCode: (code: string) => void
  joinPassword: string
  setJoinPassword: (password: string) => void
  onJoin: () => void
}

function JoinMeetingDialog({ isOpen, onClose, joinCode, setJoinCode, joinPassword, setJoinPassword, onJoin }: JoinMeetingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Join Meeting
          </DialogTitle>
          <DialogDescription>
            Enter the meeting code to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Meeting Code *</Label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC-123-XYZ"
              className="mt-1.5 font-mono text-center text-lg tracking-wider"
              maxLength={11}
            />
          </div>

          <div>
            <Label>Password (if required)</Label>
            <Input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Enter meeting password"
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onJoin} disabled={!joinCode.trim()} className="gap-2">
            <Video className="h-4 w-4" />
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Meeting Room Component
interface MeetingRoomProps {
  meeting: VideoMeeting
  isOpen: boolean
  onClose: () => void
  getCategoryColor: (category: VideoMeeting['category']) => string
}

function MeetingRoom({ meeting, isOpen, onClose, getCategoryColor }: MeetingRoomProps) {
  const { 
    toggleMeetingMute, 
    toggleMeetingVideo, 
    toggleScreenShare,
    raiseHand,
    lowerHand,
    addMeetingRecording 
  } = useFeedStore()
  
  const [isMuted, setIsMuted] = useState(meeting.settings.muteOnEntry)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Simulate getting camera feed
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.log('[v0] Camera access denied or not available:', err)
      toast.error('Could not access camera. Please check permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isOpen && isVideoOn) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, isVideoOn, startCamera, stopCamera])

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    toggleMeetingMute(meeting.id, currentUserProfile.id)
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
    }
  }

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn
    setIsVideoOn(newVideoState)
    toggleMeetingVideo(meeting.id, currentUserProfile.id)
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState
      })
    }
    if (newVideoState) {
      startCamera()
    } else {
      stopCamera()
    }
  }

  const handleToggleScreenShare = async () => {
    if (!meeting.settings.allowScreenShare) {
      toast.error('Screen sharing is disabled for this meeting')
      return
    }
    
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setIsScreenSharing(true)
        toggleScreenShare(meeting.id, currentUserProfile.id)
        toast.success('Screen sharing started')
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          toggleScreenShare(meeting.id, currentUserProfile.id)
          toast.success('Screen sharing stopped')
        }
      } catch (err) {
        console.log('[v0] Screen share cancelled:', err)
      }
    } else {
      setIsScreenSharing(false)
      toggleScreenShare(meeting.id, currentUserProfile.id)
    }
  }

  const handleToggleRecording = () => {
    if (!meeting.settings.allowRecording) {
      toast.error('Recording is disabled for this meeting')
      return
    }

    if (!isRecording) {
      setIsRecording(true)
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      toast.success('Recording started')
    } else {
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      // Simulate saving recording
      const recording: Recording = {
        id: `rec-${Date.now()}`,
        type: 'video',
        url: '#', // Would be actual URL in production
        duration: recordingTime,
        size: recordingTime * 1000000, // Simulate ~1MB per second
        createdAt: new Date().toISOString(),
        title: meeting.title
      }
      addMeetingRecording(meeting.id, recording)
      toast.success(`Recording saved (${formatDuration(recordingTime)})`)
    }
  }

  const handleRaiseHand = () => {
    if (!isHandRaised) {
      setIsHandRaised(true)
      raiseHand(meeting.id, currentUserProfile.id)
      toast.success('Hand raised')
    } else {
      setIsHandRaised(false)
      lowerHand(meeting.id, currentUserProfile.id)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyMeetingCode = () => {
    navigator.clipboard.writeText(meeting.meetingCode)
    toast.success('Meeting code copied!')
  }

  const allParticipants = [meeting.host, ...meeting.participants]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-6xl h-[90vh] p-0 gap-0",
        isFullscreen && "max-w-full h-screen rounded-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
              LIVE
            </Badge>
            {isRecording && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50 animate-pulse">
                <Circle className="h-2 w-2 mr-1 fill-red-500 text-red-500" />
                REC {formatDuration(recordingTime)}
              </Badge>
            )}
            <h3 className="font-semibold truncate max-w-md">{meeting.title}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              <Users className="h-4 w-4" />
              {allParticipants.length}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={copyMeetingCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy meeting code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
                >
                  {viewMode === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{viewMode === 'grid' ? 'Speaker view' : 'Grid view'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowChat(!showChat)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Meeting Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onClose}>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Leave Meeting
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video Grid */}
          <div className={cn(
            "flex-1 p-4 bg-background",
            viewMode === 'grid' ? 'grid gap-4' : 'flex flex-col gap-4',
            viewMode === 'grid' && allParticipants.length <= 4 && 'grid-cols-2',
            viewMode === 'grid' && allParticipants.length > 4 && 'grid-cols-3'
          )}>
            {/* Self Video (large if speaker view) */}
            <div className={cn(
              "relative bg-muted rounded-lg overflow-hidden",
              viewMode === 'speaker' ? 'flex-1' : 'aspect-video',
              !isVideoOn && 'flex items-center justify-center'
            )}>
              {isVideoOn ? (
                <video 
                  ref={videoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUserProfile.avatar} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {currentUserProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-3 font-medium">{currentUserProfile.name}</p>
                </div>
              )}
              
              {/* Status indicators */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-background/80">
                  {currentUserProfile.name} (You)
                </Badge>
                {isMuted && (
                  <div className="h-6 w-6 rounded-full bg-red-500/90 flex items-center justify-center">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Other Participants */}
            {viewMode === 'grid' ? (
              allParticipants.filter(p => p.id !== currentUserProfile.id).map(participant => (
                <ParticipantVideo 
                  key={participant.id} 
                  participant={participant}
                />
              ))
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allParticipants.filter(p => p.id !== currentUserProfile.id).map(participant => (
                  <ParticipantVideo 
                    key={participant.id} 
                    participant={participant}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          {showChat && meeting.settings.allowChat && (
            <div className="w-80 border-l flex flex-col">
              <div className="p-3 border-b font-medium text-sm">Meeting Chat</div>
              <ScrollArea className="flex-1 p-3">
                <div className="text-center text-sm text-muted-foreground py-8">
                  Chat messages will appear here
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <Input placeholder="Type a message..." className="text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 p-4 border-t bg-muted/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleToggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!isVideoOn ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleToggleVideo}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isVideoOn ? 'Turn off camera' : 'Turn on camera'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleToggleScreenShare}
                disabled={!meeting.settings.allowScreenShare}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!meeting.settings.allowScreenShare ? 'Screen sharing disabled' : 
               isScreenSharing ? 'Stop sharing' : 'Share screen'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHandRaised ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleRaiseHand}
              >
                <Hand className={cn("h-5 w-5", isHandRaised && "animate-bounce")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isHandRaised ? 'Lower hand' : 'Raise hand'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleToggleRecording}
                disabled={!meeting.settings.allowRecording}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!meeting.settings.allowRecording ? 'Recording disabled' :
               isRecording ? 'Stop recording' : 'Start recording'}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-border mx-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-12 px-6 gap-2"
                onClick={onClose}
              >
                <PhoneOff className="h-5 w-5" />
                Leave
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave meeting</TooltipContent>
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Participant Video Component
interface ParticipantVideoProps {
  participant: MeetingParticipant
  compact?: boolean
}

function ParticipantVideo({ participant, compact }: ParticipantVideoProps) {
  return (
    <div className={cn(
      "relative bg-muted rounded-lg overflow-hidden flex items-center justify-center",
      compact ? "w-40 h-24 flex-shrink-0" : "aspect-video"
    )}>
      {participant.isVideoOn ? (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Avatar className={cn(compact ? "h-10 w-10" : "h-16 w-16")}>
            <AvatarImage src={participant.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {participant.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <Avatar className={cn(compact ? "h-10 w-10" : "h-16 w-16")}>
            <AvatarImage src={participant.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {participant.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!compact && <p className="mt-2 text-sm font-medium">{participant.name}</p>}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 flex items-center gap-1">
        <Badge variant="secondary" className={cn("text-xs bg-background/80", compact && "text-[10px] px-1.5 py-0.5")}>
          {participant.name}
        </Badge>
        {participant.isMuted && (
          <div className={cn("rounded-full bg-red-500/90 flex items-center justify-center", compact ? "h-4 w-4" : "h-5 w-5")}>
            <MicOff className={cn("text-white", compact ? "h-2 w-2" : "h-3 w-3")} />
          </div>
        )}
        {participant.isHandRaised && (
          <div className={cn("rounded-full bg-yellow-500/90 flex items-center justify-center", compact ? "h-4 w-4" : "h-5 w-5")}>
            <Hand className={cn("text-white", compact ? "h-2 w-2" : "h-3 w-3")} />
          </div>
        )}
      </div>
    </div>
  )
}
