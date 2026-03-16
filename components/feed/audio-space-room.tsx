"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Radio,
  Users,
  Hand,
  LogOut,
  Settings,
  MoreHorizontal,
  Circle,
  Download,
  Share2,
  Headphones,
  Volume2,
  VolumeX,
  Copy,
  Link2,
  UserPlus,
  Crown,
  Shield,
  Clock,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  MediaManager, 
  RecordingManager, 
  AudioAnalyzer,
  SimulatedPeerManager,
  TEST_USERS,
  formatDuration,
  formatFileSize,
  generateJoinLink,
  type TestUser
} from '@/lib/webrtc-service'
import { type Space, type SpaceParticipant } from '@/lib/feed-store'

interface AudioSpaceRoomProps {
  space: Space
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onUpdateSpace?: (updates: Partial<Space>) => void
}

export function AudioSpaceRoom({ 
  space, 
  isOpen, 
  onClose, 
  currentUserId,
  onUpdateSpace
}: AudioSpaceRoomProps) {
  // Media state
  const [isMuted, setIsMuted] = useState(true)
  const [isListening, setIsListening] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(space.isRecorded || false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [showRecordingDialog, setShowRecordingDialog] = useState(false)
  
  // Participants state
  const [participants, setParticipants] = useState<Map<string, { user: TestUser; audioLevel: number; isSpeaking: boolean }>>(new Map())
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [simulatedUsers, setSimulatedUsers] = useState<TestUser[]>([])
  
  // Elapsed time
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Refs for managers
  const mediaManager = useRef<MediaManager | null>(null)
  const recordingManager = useRef<RecordingManager | null>(null)
  const audioAnalyzer = useRef<AudioAnalyzer | null>(null)
  const peerManager = useRef<SimulatedPeerManager | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get current user role
  const isHost = space.hostId === currentUserId
  const isCoHost = space.coHosts.some(ch => ch.id === currentUserId)
  const isSpeaker = space.speakers.some(s => s.id === currentUserId) || isHost || isCoHost
  const currentUserRole = isHost ? 'host' : isCoHost ? 'co-host' : isSpeaker ? 'speaker' : 'listener'

  // Initialize on mount
  useEffect(() => {
    if (isOpen) {
      initializeAudio()
      startTimer()
      initializeSimulation()
    }
    
    return () => {
      cleanup()
    }
  }, [isOpen])

  const initializeAudio = async () => {
    try {
      mediaManager.current = new MediaManager()
      recordingManager.current = new RecordingManager()
      audioAnalyzer.current = new AudioAnalyzer()
      
      if (isSpeaker) {
        const stream = await mediaManager.current.getAudioStream()
        mediaManager.current.toggleAudio(false) // Start muted
        
        // Start audio level analysis
        audioAnalyzer.current.start(stream, (level) => {
          setAudioLevel(level)
        })
        
        // Start recording if enabled
        if (space.isRecorded) {
          recordingManager.current.startRecording(stream, 'audio', (blob) => {
            setRecordedBlob(blob)
          })
          setIsRecording(true)
        }
      }
      
      setIsConnected(true)
      toast.success('Connected to Space')
    } catch (error) {
      console.error('[v0] Failed to initialize audio:', error)
      toast.error('Failed to access microphone. Please check permissions.')
    }
  }

  const initializeSimulation = () => {
    peerManager.current = new SimulatedPeerManager()
    
    // Add simulated participants
    const otherUsers = TEST_USERS.filter(u => u.id !== currentUserId).slice(0, 3)
    otherUsers.forEach(user => {
      peerManager.current?.addPeer(user)
    })
    setSimulatedUsers(otherUsers)
    
    // Initialize participants map
    const initialParticipants = new Map<string, { user: TestUser; audioLevel: number; isSpeaking: boolean }>()
    otherUsers.forEach(user => {
      initialParticipants.set(user.id, { user, audioLevel: 0, isSpeaking: false })
    })
    setParticipants(initialParticipants)
    
    // Start simulation
    peerManager.current?.startSimulation((userId, level) => {
      setParticipants(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(userId)
        if (existing) {
          newMap.set(userId, { ...existing, audioLevel: level, isSpeaking: level > 20 })
        }
        return newMap
      })
    })
  }

  const startTimer = () => {
    if (space.startedAt) {
      const startTime = new Date(space.startedAt).getTime()
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
  }

  const cleanup = () => {
    mediaManager.current?.stopLocalStream()
    audioAnalyzer.current?.stop()
    peerManager.current?.stopSimulation()
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsConnected(false)
  }

  const toggleMute = () => {
    if (mediaManager.current) {
      const newMuted = !isMuted
      mediaManager.current.toggleAudio(!newMuted)
      setIsMuted(newMuted)
      toast.success(newMuted ? 'Microphone muted' : 'Microphone unmuted')
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    toast.success(isListening ? 'Audio muted' : 'Audio unmuted')
  }

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    toast.success(isHandRaised ? 'Hand lowered' : 'Hand raised')
  }

  const stopRecording = async () => {
    if (recordingManager.current?.isRecording()) {
      try {
        const blob = await recordingManager.current.stopRecording()
        setRecordedBlob(blob)
        setIsRecording(false)
        setShowRecordingDialog(true)
        toast.success('Recording stopped')
      } catch (error) {
        console.error('[v0] Failed to stop recording:', error)
        toast.error('Failed to stop recording')
      }
    }
  }

  const downloadRecording = () => {
    if (recordedBlob && recordingManager.current) {
      const filename = `space-${space.id}-${new Date().toISOString().slice(0, 10)}.webm`
      recordingManager.current.downloadRecording(recordedBlob, filename)
      toast.success('Recording downloaded')
    }
  }

  const copyJoinLink = () => {
    const link = generateJoinLink(space.id, 'space')
    navigator.clipboard.writeText(link)
    toast.success('Join link copied to clipboard')
  }

  const leaveSpace = () => {
    if (isRecording) {
      stopRecording()
    }
    cleanup()
    onClose()
  }

  const endSpace = async () => {
    if (isRecording) {
      await stopRecording()
    }
    cleanup()
    onUpdateSpace?.({ status: 'ended', endedAt: new Date().toISOString() })
    onClose()
    toast.success('Space ended')
  }

  if (!isOpen) return null

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => !open && leaveSpace()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="relative">
                    <Radio className="h-5 w-5 text-rose-500" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                  <Badge variant="outline" className="text-xs text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/50">
                    LIVE
                  </Badge>
                  {isRecording && (
                    <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50 dark:bg-red-950/50 gap-1">
                      <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                      REC
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {space.category}
                  </Badge>
                </div>
                <h2 className="text-lg font-semibold truncate pr-4">{space.title}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(elapsedTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {space.totalParticipants + participants.size} listening
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={copyJoinLink}>
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy join link</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setShowInviteDialog(true)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invite participants</TooltipContent>
                </Tooltip>
                {(isHost || isCoHost) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowSettingsDialog(true)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Space settings</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* Participants Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Hosts & Speakers */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Speakers
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {/* Host */}
                  <ParticipantAvatar
                    name={space.host.name}
                    username={space.host.username}
                    avatar={space.host.avatar}
                    role="host"
                    isSpeaking={!isMuted && audioLevel > 20 && space.host.id === currentUserId}
                    isMuted={space.host.id === currentUserId ? isMuted : space.host.isMuted}
                    audioLevel={space.host.id === currentUserId ? audioLevel : 0}
                    isCurrentUser={space.host.id === currentUserId}
                  />
                  
                  {/* Co-hosts */}
                  {space.coHosts.map(coHost => (
                    <ParticipantAvatar
                      key={coHost.id}
                      name={coHost.name}
                      username={coHost.username}
                      avatar={coHost.avatar}
                      role="co-host"
                      isSpeaking={coHost.isSpeaking}
                      isMuted={coHost.isMuted}
                      isCurrentUser={coHost.id === currentUserId}
                    />
                  ))}
                  
                  {/* Speakers */}
                  {space.speakers.map(speaker => (
                    <ParticipantAvatar
                      key={speaker.id}
                      name={speaker.name}
                      username={speaker.username}
                      avatar={speaker.avatar}
                      role="speaker"
                      isSpeaking={speaker.isSpeaking}
                      isMuted={speaker.isMuted}
                      isCurrentUser={speaker.id === currentUserId}
                    />
                  ))}
                  
                  {/* Simulated Speakers */}
                  {Array.from(participants.values())
                    .filter(p => p.user.role === 'speaker' || p.user.role === 'host' || p.user.role === 'co-host')
                    .map(({ user, audioLevel: level, isSpeaking }) => (
                      <ParticipantAvatar
                        key={user.id}
                        name={user.name}
                        username={user.username}
                        role={user.role}
                        isSpeaking={isSpeaking}
                        isMuted={false}
                        audioLevel={level}
                        color={user.color}
                        isSimulated
                      />
                    ))}
                </div>
              </div>

              <Separator />

              {/* Listeners */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  Listeners ({space.listeners.length + Array.from(participants.values()).filter(p => p.user.role === 'listener').length})
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {space.listeners.map(listener => (
                    <ParticipantAvatar
                      key={listener.id}
                      name={listener.name}
                      username={listener.username}
                      avatar={listener.avatar}
                      role="listener"
                      compact
                      isCurrentUser={listener.id === currentUserId}
                      hasHandRaised={listener.id === currentUserId && isHandRaised}
                    />
                  ))}
                  
                  {/* Simulated Listeners */}
                  {Array.from(participants.values())
                    .filter(p => p.user.role === 'listener')
                    .map(({ user }) => (
                      <ParticipantAvatar
                        key={user.id}
                        name={user.name}
                        username={user.username}
                        role="listener"
                        compact
                        color={user.color}
                        isSimulated
                      />
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Connection Status Alert */}
          {!isConnected && (
            <Alert variant="destructive" className="mx-4 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Issue</AlertTitle>
              <AlertDescription>
                Trying to reconnect to the Space...
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="border-t bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Leave Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={leaveSpace}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Leave
                </Button>
                
                {/* End Space (Host only) */}
                {isHost && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={endSpace}
                    className="gap-2"
                  >
                    End Space
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Audio Level Indicator */}
                {isSpeaker && !isMuted && (
                  <div className="flex items-center gap-1 mr-2">
                    <div className="flex gap-0.5 h-4 items-end">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 rounded-full transition-all duration-100",
                            audioLevel > i * 20 
                              ? "bg-primary" 
                              : "bg-muted-foreground/30"
                          )}
                          style={{ height: `${(i + 1) * 4}px` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Hand Raise (Listeners only) */}
                {!isSpeaker && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isHandRaised ? "default" : "outline"} 
                        size="icon"
                        onClick={toggleHandRaise}
                        className={cn(isHandRaised && "bg-amber-500 hover:bg-amber-600")}
                      >
                        <Hand className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isHandRaised ? 'Lower hand' : 'Raise hand to speak'}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Listen Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleListening}
                    >
                      {isListening ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening ? 'Mute audio' : 'Unmute audio'}
                  </TooltipContent>
                </Tooltip>
                
                {/* Mic Toggle (Speakers only) */}
                {isSpeaker && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isMuted ? "outline" : "default"} 
                        size="icon"
                        onClick={toggleMute}
                        className={cn(
                          !isMuted && "bg-primary hover:bg-primary/90",
                          isMuted && "border-destructive text-destructive hover:bg-destructive/10"
                        )}
                      >
                        {isMuted ? (
                          <MicOff className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMuted ? 'Unmute' : 'Mute'}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Recording controls (Host only) */}
                {isHost && isRecording && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={stopRecording}
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Circle className="h-4 w-4 fill-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop recording</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite to Space</DialogTitle>
            <DialogDescription>
              Share this link with others to join the Space
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm truncate">
                {generateJoinLink(space.id, 'space')}
              </code>
              <Button size="sm" variant="ghost" onClick={copyJoinLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Test Accounts Available</h4>
              <div className="grid gap-2">
                {TEST_USERS.filter(u => u.id !== currentUserId).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording Dialog */}
      <Dialog open={showRecordingDialog} onOpenChange={setShowRecordingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recording Complete</DialogTitle>
            <DialogDescription>
              Your Space recording is ready to download
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Radio className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{space.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(recordingDuration)}
                    {recordedBlob && ` - ${formatFileSize(recordedBlob.size)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordingDialog(false)}>
              Close
            </Button>
            <Button onClick={downloadRecording} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Space Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Recording</Label>
                <p className="text-sm text-muted-foreground">Record this Space</p>
              </div>
              <Switch checked={isRecording} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Requests to Speak</Label>
                <p className="text-sm text-muted-foreground">Listeners can request to speak</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

// Participant Avatar Component
interface ParticipantAvatarProps {
  name: string
  username: string
  avatar?: string
  role: 'host' | 'co-host' | 'speaker' | 'listener'
  isSpeaking?: boolean
  isMuted?: boolean
  audioLevel?: number
  isCurrentUser?: boolean
  hasHandRaised?: boolean
  compact?: boolean
  color?: string
  isSimulated?: boolean
}

function ParticipantAvatar({
  name,
  username,
  avatar,
  role,
  isSpeaking,
  isMuted,
  audioLevel = 0,
  isCurrentUser,
  hasHandRaised,
  compact,
  color,
  isSimulated
}: ParticipantAvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('')
  
  const roleIcon = role === 'host' ? Crown : role === 'co-host' ? Shield : null
  const RoleIcon = roleIcon
  
  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5",
      compact && "gap-1"
    )}>
      <div className="relative">
        <div className={cn(
          "rounded-full p-0.5 transition-all",
          isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}>
          <Avatar className={cn(
            compact ? "h-10 w-10" : "h-14 w-14",
            isCurrentUser && "ring-2 ring-primary"
          )}>
            <AvatarImage src={avatar} />
            <AvatarFallback 
              className={cn(
                "text-white font-medium",
                compact ? "text-xs" : "text-sm"
              )}
              style={{ backgroundColor: color || '#6366F1' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Role Badge */}
        {RoleIcon && (
          <div className={cn(
            "absolute -top-1 -right-1 rounded-full p-1",
            role === 'host' ? "bg-amber-500" : "bg-blue-500"
          )}>
            <RoleIcon className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        
        {/* Mute indicator */}
        {isMuted && !compact && (
          <div className="absolute -bottom-1 -right-1 bg-destructive rounded-full p-1">
            <MicOff className="h-2.5 w-2.5 text-destructive-foreground" />
          </div>
        )}
        
        {/* Hand raised */}
        {hasHandRaised && (
          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 animate-bounce">
            <Hand className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        
        {/* Speaking animation */}
        {isSpeaking && !compact && (
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        )}
        
        {/* Simulated badge */}
        {isSimulated && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-background">
              Test
            </Badge>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className={cn(
          "font-medium truncate max-w-[80px]",
          compact ? "text-xs" : "text-sm"
        )}>
          {name.split(' ')[0]}
          {isCurrentUser && <span className="text-muted-foreground"> (You)</span>}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate max-w-[80px]">
            @{username}
          </p>
        )}
      </div>
    </div>
  )
}
