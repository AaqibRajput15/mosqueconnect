"use client"

import { useState, useMemo } from 'react'
import { 
  Rss,
  Radio,
  Video,
  Mic,
  Users,
  Calendar,
  Plus,
  ChevronRight,
  Clock,
  Settings,
  Play,
  Download,
  Share2,
  Search,
  Filter,
  TrendingUp,
  Sparkles,
  Grid3X3,
  List,
  LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFeedStore, type Space, type VideoMeeting, type SpaceParticipant, type MeetingParticipant, currentUserProfile } from '@/lib/feed-store'
import { FeedView } from './feed-view'
import { AudioSpaceRoom } from './audio-space-room'
import { VideoMeetingRoom } from './video-meeting-room'
import { UserSwitcher, useCurrentUser, TestAccountPanel } from './user-switcher'
import { formatDuration, generateJoinLink } from '@/lib/webrtc-service'

interface ComprehensiveFeedProps {
  defaultTab?: 'feed' | 'spaces' | 'meetings' | 'recordings'
}

export function ComprehensiveFeed({ defaultTab = 'feed' }: ComprehensiveFeedProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:flex h-auto p-1">
            <TabsTrigger value="feed" className="gap-2 px-4 py-2">
              <Rss className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="spaces" className="gap-2 px-4 py-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Spaces</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2 px-4 py-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="recordings" className="gap-2 px-4 py-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Recordings</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <UserSwitcher variant="compact" />
          </div>
        </div>

        {/* Feed Tab */}
        <TabsContent value="feed" className="mt-0">
          <FeedView />
        </TabsContent>

        {/* Spaces Tab */}
        <TabsContent value="spaces" className="mt-0">
          <SpacesTab />
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="mt-0">
          <MeetingsTab />
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="mt-0">
          <RecordingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Spaces Tab Component
function SpacesTab() {
  const { 
    spaces, 
    getLiveSpaces, 
    getScheduledSpaces, 
    createSpace,
    updateSpace
  } = useFeedStore()
  const { currentUser } = useCurrentUser()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isSpaceRoomOpen, setIsSpaceRoomOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [newSpace, setNewSpace] = useState({
    title: '',
    description: '',
    category: 'general' as Space['category'],
    scheduledStart: '',
    isRecorded: true
  })

  const liveSpaces = getLiveSpaces()
  const scheduledSpaces = getScheduledSpaces()
  
  const filteredLiveSpaces = useMemo(() => {
    if (!searchQuery) return liveSpaces
    return liveSpaces.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [liveSpaces, searchQuery])

  const filteredScheduledSpaces = useMemo(() => {
    if (!searchQuery) return scheduledSpaces
    return scheduledSpaces.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.host.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [scheduledSpaces, searchQuery])

  const handleCreateSpace = () => {
    if (!newSpace.title.trim()) {
      toast.error('Please enter a title for your Space')
      return
    }

    const hostParticipant: SpaceParticipant = {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: 'host',
      isMuted: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString()
    }

    createSpace({
      title: newSpace.title,
      description: newSpace.description,
      hostId: currentUser.id,
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
      isRecorded: true
    })
    setIsCreateDialogOpen(false)
    toast.success(newSpace.scheduledStart ? 'Space scheduled!' : 'Space is now live!')
  }

  const handleJoinSpace = (space: Space) => {
    setSelectedSpace(space)
    setIsSpaceRoomOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-rose-500" />
            Audio Spaces
          </h2>
          <p className="text-muted-foreground">Join live voice conversations with recording support</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Start Space
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Live Spaces */}
      {filteredLiveSpaces.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            Live Now ({filteredLiveSpaces.length})
          </h3>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {filteredLiveSpaces.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                onJoin={() => handleJoinSpace(space)}
                getCategoryColor={getCategoryColor}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Spaces */}
      {filteredScheduledSpaces.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Spaces ({filteredScheduledSpaces.length})
          </h3>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {filteredScheduledSpaces.map(space => (
              <ScheduledSpaceCard
                key={space.id}
                space={space}
                getCategoryColor={getCategoryColor}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLiveSpaces.length === 0 && filteredScheduledSpaces.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Radio className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchQuery ? 'No spaces found' : 'No Spaces Available'}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Start a live Space to have voice conversations with your community.'}
            </p>
            <Button className="mt-6 gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Mic className="h-4 w-4" />
              Start Your First Space
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Space Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-rose-500" />
              Start a Space
            </DialogTitle>
            <DialogDescription>
              Create a live voice room for the community to join
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Space Title *</Label>
              <Input
                value={newSpace.title}
                onChange={(e) => setNewSpace({ ...newSpace, title: e.target.value })}
                placeholder="What's this Space about?"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newSpace.description}
                onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                placeholder="Add more details..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newSpace.category}
                onValueChange={(v) => setNewSpace({ ...newSpace, category: v as Space['category'] })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={newSpace.scheduledStart}
                onChange={(e) => setNewSpace({ ...newSpace, scheduledStart: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>Record this Space</Label>
                <p className="text-sm text-muted-foreground">Save audio for later playback</p>
              </div>
              <Switch
                checked={newSpace.isRecorded}
                onCheckedChange={(checked) => setNewSpace({ ...newSpace, isRecorded: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSpace} className="gap-2">
              {newSpace.scheduledStart ? (
                <>
                  <Calendar className="h-4 w-4" />
                  Schedule
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Go Live
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Space Room */}
      {selectedSpace && (
        <AudioSpaceRoom
          space={selectedSpace}
          isOpen={isSpaceRoomOpen}
          onClose={() => {
            setIsSpaceRoomOpen(false)
            setSelectedSpace(null)
          }}
          currentUserId={currentUser.id}
          onUpdateSpace={(updates) => updateSpace(selectedSpace.id, updates)}
        />
      )}
    </div>
  )
}

// Meetings Tab Component
function MeetingsTab() {
  const { 
    videoMeetings,
    getLiveMeetings, 
    getScheduledMeetings, 
    createMeeting,
    updateMeeting,
    getMeetingByCode
  } = useFeedStore()
  const { currentUser } = useCurrentUser()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<VideoMeeting | null>(null)
  const [isMeetingRoomOpen, setIsMeetingRoomOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

  const filteredLiveMeetings = useMemo(() => {
    if (!searchQuery) return liveMeetings
    return liveMeetings.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [liveMeetings, searchQuery])

  const filteredScheduledMeetings = useMemo(() => {
    if (!searchQuery) return scheduledMeetings
    return scheduledMeetings.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [scheduledMeetings, searchQuery])

  const handleCreateMeeting = () => {
    if (!newMeeting.title.trim()) {
      toast.error('Please enter a title for your meeting')
      return
    }

    const hostParticipant: MeetingParticipant = {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: 'host',
      isMuted: false,
      isVideoOn: true,
      joinedAt: new Date().toISOString()
    }

    const meetingCode = createMeeting({
      title: newMeeting.title,
      description: newMeeting.description,
      hostId: currentUser.id,
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
    setSelectedMeeting(meeting)
    setIsMeetingRoomOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-500" />
            Video Meetings
          </h2>
          <p className="text-muted-foreground">Connect face-to-face with screen sharing & recording</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings or enter code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Live Meetings */}
      {filteredLiveMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Active Meetings ({filteredLiveMeetings.length})
          </h3>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {filteredLiveMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={() => handleJoinMeeting(meeting)}
                getCategoryColor={getCategoryColor}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Meetings */}
      {filteredScheduledMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Meetings ({filteredScheduledMeetings.length})
          </h3>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {filteredScheduledMeetings.map(meeting => (
              <ScheduledMeetingCard
                key={meeting.id}
                meeting={meeting}
                getCategoryColor={getCategoryColor}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLiveMeetings.length === 0 && filteredScheduledMeetings.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Video className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">
              {searchQuery ? 'No meetings found' : 'No Meetings Available'}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try adjusting your search query or join with a meeting code'
                : 'Start a video meeting to connect face-to-face with your community.'}
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
                <Users className="h-4 w-4" />
                Join with Code
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Video className="h-4 w-4" />
                Start Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Create Meeting
            </DialogTitle>
            <DialogDescription>
              Start a new video meeting with your community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting Title *</Label>
              <Input
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                placeholder="What's this meeting about?"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                placeholder="Add more details..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newMeeting.category}
                  onValueChange={(v) => setNewMeeting({ ...newMeeting, category: v as VideoMeeting['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="islamic">Islamic</SelectItem>
                    <SelectItem value="quran">Quran Class</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="sisters">Sisters Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password (Optional)</Label>
                <Input
                  type="password"
                  value={newMeeting.password}
                  onChange={(e) => setNewMeeting({ ...newMeeting, password: e.target.value })}
                  placeholder="Set a password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={newMeeting.scheduledStart}
                onChange={(e) => setNewMeeting({ ...newMeeting, scheduledStart: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Meeting Settings</Label>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Screen Sharing</span>
                  <Switch
                    checked={newMeeting.settings.allowScreenShare}
                    onCheckedChange={(checked) => setNewMeeting({ 
                      ...newMeeting, 
                      settings: { ...newMeeting.settings, allowScreenShare: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Recording</span>
                  <Switch
                    checked={newMeeting.settings.allowRecording}
                    onCheckedChange={(checked) => setNewMeeting({ 
                      ...newMeeting, 
                      settings: { ...newMeeting.settings, allowRecording: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mute on Entry</span>
                  <Switch
                    checked={newMeeting.settings.muteOnEntry}
                    onCheckedChange={(checked) => setNewMeeting({ 
                      ...newMeeting, 
                      settings: { ...newMeeting.settings, muteOnEntry: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Waiting Room</span>
                  <Switch
                    checked={newMeeting.settings.waitingRoom}
                    onCheckedChange={(checked) => setNewMeeting({ 
                      ...newMeeting, 
                      settings: { ...newMeeting.settings, waitingRoom: checked }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMeeting} className="gap-2">
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

      {/* Join Meeting Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Meeting</DialogTitle>
            <DialogDescription>
              Enter the meeting code to join
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting Code</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC-123-XYZ"
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>
            <div className="space-y-2">
              <Label>Password (if required)</Label>
              <Input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinWithCode} className="gap-2">
              <Video className="h-4 w-4" />
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Room */}
      {selectedMeeting && (
        <VideoMeetingRoom
          meeting={selectedMeeting}
          isOpen={isMeetingRoomOpen}
          onClose={() => {
            setIsMeetingRoomOpen(false)
            setSelectedMeeting(null)
          }}
          currentUserId={currentUser.id}
          onUpdateMeeting={(updates) => updateMeeting(selectedMeeting.id, updates)}
        />
      )}
    </div>
  )
}

// Recordings Tab Component
function RecordingsTab() {
  const [recordings] = useState([
    {
      id: 'rec-1',
      title: 'Friday Reflection: Lessons from Surah Al-Kahf',
      type: 'space' as const,
      duration: 3720,
      size: 45 * 1024 * 1024,
      createdAt: '2025-03-15T14:00:00Z',
      host: 'Sheikh Ahmad Hassan'
    },
    {
      id: 'rec-2',
      title: 'Mosque Board Monthly Meeting',
      type: 'meeting' as const,
      duration: 5400,
      size: 320 * 1024 * 1024,
      createdAt: '2025-03-14T19:00:00Z',
      host: 'Br. Hassan Ahmed'
    }
  ])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Recordings
          </h2>
          <p className="text-muted-foreground">Access your recorded Spaces and Meetings</p>
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map(recording => (
            <Card key={recording.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0",
                    recording.type === 'space' ? "bg-rose-500/10" : "bg-blue-500/10"
                  )}>
                    {recording.type === 'space' ? (
                      <Radio className="h-6 w-6 text-rose-500" />
                    ) : (
                      <Video className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{recording.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hosted by {recording.host}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(recording.duration)}
                      </span>
                      <span>{formatFileSize(recording.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                    <Play className="h-3.5 w-3.5" />
                    Play
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Download className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No Recordings Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Recordings from your Spaces and Meetings will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Space Card Component
interface SpaceCardProps {
  space: Space
  onJoin: () => void
  getCategoryColor: (category: Space['category']) => string
  viewMode: 'grid' | 'list'
}

function SpaceCard({ space, onJoin, getCategoryColor, viewMode }: SpaceCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden border-l-4 border-l-rose-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={space.host.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {space.host.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
                  {space.category}
                </Badge>
                <Badge variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/50">
                  LIVE
                </Badge>
                {space.isRecorded && (
                  <Badge variant="outline" className="text-xs text-red-600 border-red-200">REC</Badge>
                )}
              </div>
              <h4 className="font-semibold truncate">{space.title}</h4>
              <p className="text-sm text-muted-foreground">
                {space.host.name} · {space.totalParticipants} listening
              </p>
            </div>
            <Button onClick={onJoin} className="gap-2 flex-shrink-0">
              <Mic className="h-4 w-4" />
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-rose-200 dark:border-rose-900/50">
      <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
            {space.category}
          </Badge>
          <Badge variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/50">
            LIVE
          </Badge>
          {space.isRecorded && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">REC</Badge>
          )}
        </div>
        <h4 className="font-semibold truncate">{space.title}</h4>
        {space.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{space.description}</p>
        )}
        
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={space.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {space.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{space.host.name}</p>
            <p className="text-xs text-muted-foreground">Host</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{space.totalParticipants} listening</span>
          </div>
          <Button size="sm" onClick={onJoin} className="gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            Tune In
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
  viewMode: 'grid' | 'list'
}

function ScheduledSpaceCard({ space, getCategoryColor, viewMode }: ScheduledSpaceCardProps) {
  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
                  {space.category}
                </Badge>
              </div>
              <h4 className="font-semibold truncate">{space.title}</h4>
              <p className="text-sm text-muted-foreground">
                {formatScheduledTime(space.scheduledStart!)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
              <Calendar className="h-4 w-4" />
              Remind Me
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(space.category))}>
            {space.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        </div>
        
        <h4 className="font-semibold truncate">{space.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {formatScheduledTime(space.scheduledStart!)}
        </p>
        
        <div className="flex items-center gap-2 mt-3">
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

        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Set Reminder
        </Button>
      </CardContent>
    </Card>
  )
}

// Meeting Card Component
interface MeetingCardProps {
  meeting: VideoMeeting
  onJoin: () => void
  getCategoryColor: (category: VideoMeeting['category']) => string
  viewMode: 'grid' | 'list'
}

function MeetingCard({ meeting, onJoin, getCategoryColor, viewMode }: MeetingCardProps) {
  const copyMeetingCode = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(meeting.meetingCode)
    toast.success('Meeting code copied!')
  }

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={meeting.host.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {meeting.host.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
                  {meeting.category}
                </Badge>
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/50">
                  LIVE
                </Badge>
                {meeting.isRecorded && (
                  <Badge variant="outline" className="text-xs text-red-600 border-red-200">REC</Badge>
                )}
              </div>
              <h4 className="font-semibold truncate">{meeting.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{meeting.host.name}</span>
                <span>·</span>
                <span>{meeting.totalParticipants} in meeting</span>
                <span>·</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/80" onClick={copyMeetingCode}>
                  {meeting.meetingCode}
                </code>
              </div>
            </div>
            <Button onClick={onJoin} className="gap-2 flex-shrink-0">
              <Video className="h-4 w-4" />
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-blue-200 dark:border-blue-900/50">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
            {meeting.category}
          </Badge>
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/50">
            LIVE
          </Badge>
          {meeting.isRecorded && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">REC</Badge>
          )}
        </div>
        <h4 className="font-semibold truncate">{meeting.title}</h4>
        {meeting.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>
        )}
        
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={meeting.host.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {meeting.host.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{meeting.host.name}</p>
            <p className="text-xs text-muted-foreground">Host</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-md">
          <code className="text-xs font-mono flex-1">{meeting.meetingCode}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyMeetingCode}>
            <Share2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{meeting.totalParticipants} in meeting</span>
          </div>
          <Button size="sm" onClick={onJoin} className="gap-1.5">
            <Video className="h-3.5 w-3.5" />
            Join
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
  viewMode: 'grid' | 'list'
}

function ScheduledMeetingCard({ meeting, getCategoryColor, viewMode }: ScheduledMeetingCardProps) {
  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
                  {meeting.category}
                </Badge>
              </div>
              <h4 className="font-semibold truncate">{meeting.title}</h4>
              <p className="text-sm text-muted-foreground">
                {formatScheduledTime(meeting.scheduledStart!)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
              <Calendar className="h-4 w-4" />
              Remind Me
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={cn("text-xs", getCategoryColor(meeting.category))}>
            {meeting.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        </div>
        
        <h4 className="font-semibold truncate">{meeting.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {formatScheduledTime(meeting.scheduledStart!)}
        </p>
        
        <div className="flex items-center gap-2 mt-3">
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

        <div className="flex items-center gap-2 mt-3 p-2 bg-muted/50 rounded-md">
          <code className="text-xs font-mono flex-1">{meeting.meetingCode}</code>
        </div>

        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Set Reminder
        </Button>
      </CardContent>
    </Card>
  )
}
