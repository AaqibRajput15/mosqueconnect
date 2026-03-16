"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Monitor,
  MonitorOff,
  Users,
  Hand,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Circle,
  Download,
  Share2,
  Copy,
  Link2,
  UserPlus,
  Crown,
  Shield,
  Clock,
  X,
  Maximize2,
  Minimize2,
  Grid,
  LayoutGrid,
  Pin,
  PinOff,
  ChevronUp,
  ChevronDown,
  Send,
  Smile,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { type VideoMeeting, type MeetingParticipant } from '@/lib/feed-store'

interface VideoMeetingRoomProps {
  meeting: VideoMeeting
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onUpdateMeeting?: (updates: Partial<VideoMeeting>) => void
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: Date
}

export function VideoMeetingRoom({ 
  meeting, 
  isOpen, 
  onClose, 
  currentUserId,
  onUpdateMeeting
}: VideoMeetingRoomProps) {
  // Media state
  const [isMuted, setIsMuted] = useState(meeting.settings.muteOnEntry)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(meeting.isRecorded || false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [showRecordingDialog, setShowRecordingDialog] = useState(false)
  
  // UI state
  const [layout, setLayout] = useState<'grid' | 'speaker'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pinnedUser, setPinnedUser] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showControlsBar, setShowControlsBar] = useState(true)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  // Participants state
  const [simulatedParticipants, setSimulatedParticipants] = useState<Map<string, { user: TestUser; isVideoOn: boolean; isMuted: boolean; audioLevel: number }>>(new Map())
  
  // Elapsed time
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const mediaManager = useRef<MediaManager | null>(null)
  const recordingManager = useRef<RecordingManager | null>(null)
  const audioAnalyzer = useRef<AudioAnalyzer | null>(null)
  const peerManager = useRef<SimulatedPeerManager | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Get current user role
  const isHost = meeting.hostId === currentUserId
  const isCoHost = meeting.participants.some(p => p.id === currentUserId && p.role === 'co-host')
  const canRecord = isHost || isCoHost

  // Initialize on mount
  useEffect(() => {
    if (isOpen) {
      initializeMedia()
      startTimer()
      initializeSimulation()
      addSystemMessage('You joined the meeting')
    }
    
    return () => {
      cleanup()
    }
  }, [isOpen])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const initializeMedia = async () => {
    try {
      mediaManager.current = new MediaManager()
      recordingManager.current = new RecordingManager()
      audioAnalyzer.current = new AudioAnalyzer()
      
      const stream = await mediaManager.current.getVideoStream()
      
      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Start muted if setting enabled
      if (meeting.settings.muteOnEntry) {
        mediaManager.current.toggleAudio(false)
      }
      
      // Start audio level analysis
      audioAnalyzer.current.start(stream, (level) => {
        setAudioLevel(level)
      })
      
      // Start recording if enabled
      if (meeting.isRecorded && meeting.settings.allowRecording) {
        startRecording(stream)
      }
      
      setIsConnected(true)
      toast.success('Connected to meeting')
    } catch (error) {
      console.error('[v0] Failed to initialize media:', error)
      toast.error('Failed to access camera/microphone. Please check permissions.')
    }
  }

  const initializeSimulation = () => {
    peerManager.current = new SimulatedPeerManager()
    
    // Add simulated participants
    const otherUsers = TEST_USERS.filter(u => u.id !== currentUserId).slice(0, 3)
    const initialParticipants = new Map<string, { user: TestUser; isVideoOn: boolean; isMuted: boolean; audioLevel: number }>()
    
    otherUsers.forEach(user => {
      peerManager.current?.addPeer(user)
      initialParticipants.set(user.id, { 
        user, 
        isVideoOn: Math.random() > 0.3, 
        isMuted: Math.random() > 0.5,
        audioLevel: 0
      })
    })
    
    setSimulatedParticipants(initialParticipants)
    
    // Start simulation
    peerManager.current?.startSimulation((userId, level) => {
      setSimulatedParticipants(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(userId)
        if (existing && !existing.isMuted) {
          newMap.set(userId, { ...existing, audioLevel: level })
        }
        return newMap
      })
    })
    
    // Simulate chat messages
    setTimeout(() => {
      addChatMessage(otherUsers[0]?.id || 'test-user-2', otherUsers[0]?.name || 'Test User', 'Assalamu Alaikum everyone!')
    }, 3000)
    
    setTimeout(() => {
      addChatMessage(otherUsers[1]?.id || 'test-user-3', otherUsers[1]?.name || 'Test User 2', 'Wa Alaikum Assalam!')
    }, 5000)
  }

  const startTimer = () => {
    if (meeting.startedAt) {
      const startTime = new Date(meeting.startedAt).getTime()
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
  }

  const startRecording = (stream: MediaStream) => {
    if (recordingManager.current) {
      const success = recordingManager.current.startRecording(stream, 'video', (blob) => {
        setRecordedBlob(blob)
      })
      
      if (success) {
        setIsRecording(true)
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(recordingManager.current?.getRecordingDuration() || 0)
        }, 1000)
        toast.success('Recording started')
      }
    }
  }

  const cleanup = () => {
    mediaManager.current?.stopLocalStream()
    mediaManager.current?.stopScreenStream()
    audioAnalyzer.current?.stop()
    peerManager.current?.stopSimulation()
    if (timerRef.current) clearInterval(timerRef.current)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
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

  const toggleVideo = () => {
    if (mediaManager.current) {
      const newVideoState = !isVideoOn
      mediaManager.current.toggleVideo(newVideoState)
      setIsVideoOn(newVideoState)
      toast.success(newVideoState ? 'Camera on' : 'Camera off')
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      mediaManager.current?.stopScreenStream()
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null
      }
      setIsScreenSharing(false)
      toast.success('Screen sharing stopped')
    } else {
      try {
        const stream = await mediaManager.current?.getScreenStream()
        if (stream && screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false)
            toast.info('Screen sharing ended')
          }
        }
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      } catch (error) {
        console.error('[v0] Failed to start screen share:', error)
        toast.error('Failed to start screen sharing')
      }
    }
  }

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised)
    if (!isHandRaised) {
      addSystemMessage('You raised your hand')
    }
    toast.success(isHandRaised ? 'Hand lowered' : 'Hand raised')
  }

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        const blob = await recordingManager.current?.stopRecording()
        if (blob) {
          setRecordedBlob(blob)
          setShowRecordingDialog(true)
        }
        setIsRecording(false)
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        toast.success('Recording stopped')
      } catch (error) {
        console.error('[v0] Failed to stop recording:', error)
      }
    } else {
      const stream = mediaManager.current?.getLocalStream()
      if (stream) {
        startRecording(stream)
      }
    }
  }

  const downloadRecording = () => {
    if (recordedBlob && recordingManager.current) {
      const filename = `meeting-${meeting.meetingCode}-${new Date().toISOString().slice(0, 10)}.webm`
      recordingManager.current.downloadRecording(recordedBlob, filename)
      toast.success('Recording downloaded')
    }
  }

  const copyMeetingCode = () => {
    navigator.clipboard.writeText(meeting.meetingCode)
    toast.success('Meeting code copied')
  }

  const copyJoinLink = () => {
    const link = generateJoinLink(meeting.id, 'meeting')
    navigator.clipboard.writeText(link)
    toast.success('Join link copied to clipboard')
  }

  const addChatMessage = (userId: string, userName: string, message: string) => {
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      userId,
      userName,
      message,
      timestamp: new Date()
    }])
  }

  const addSystemMessage = (message: string) => {
    setChatMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      userId: 'system',
      userName: 'System',
      message,
      timestamp: new Date()
    }])
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    addChatMessage(currentUserId, 'You', newMessage)
    setNewMessage('')
  }

  const leaveMeeting = () => {
    if (isRecording && canRecord) {
      toggleRecording()
    }
    cleanup()
    onClose()
  }

  const endMeeting = async () => {
    if (isRecording) {
      await recordingManager.current?.stopRecording()
    }
    cleanup()
    onUpdateMeeting?.({ status: 'ended', endedAt: new Date().toISOString() })
    onClose()
    toast.success('Meeting ended')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!isOpen) return null

  const totalParticipants = 1 + simulatedParticipants.size // Current user + simulated

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => !open && leaveMeeting()}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex flex-col h-full bg-zinc-900 text-white">
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700 transition-all",
              !showControlsBar && "opacity-0 pointer-events-none h-0 py-0"
            )}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Video className="h-5 w-5 text-blue-400" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <Badge variant="outline" className="text-xs border-green-500/50 text-green-400 bg-green-500/10">
                    LIVE
                  </Badge>
                  {isRecording && (
                    <Badge variant="outline" className="text-xs text-red-400 border-red-500/50 bg-red-500/10 gap-1">
                      <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                      REC {formatDuration(recordingDuration)}
                    </Badge>
                  )}
                </div>
                
                <Separator orientation="vertical" className="h-5 bg-zinc-600" />
                
                <div>
                  <h2 className="text-sm font-medium truncate max-w-[200px]">{meeting.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(elapsedTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {totalParticipants}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={copyMeetingCode} className="text-zinc-400 hover:text-white hover:bg-zinc-700 gap-1.5 h-8">
                  <code className="text-xs">{meeting.meetingCode}</code>
                  <Copy className="h-3 w-3" />
                </Button>
                
                <Separator orientation="vertical" className="h-5 bg-zinc-600 mx-1" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={copyJoinLink} className="text-zinc-400 hover:text-white hover:bg-zinc-700 h-8 w-8">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy join link</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setShowInviteDialog(true)} className="text-zinc-400 hover:text-white hover:bg-zinc-700 h-8 w-8">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Invite</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setLayout(layout === 'grid' ? 'speaker' : 'grid')} className="text-zinc-400 hover:text-white hover:bg-zinc-700 h-8 w-8">
                      {layout === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{layout === 'grid' ? 'Speaker view' : 'Grid view'}</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-zinc-400 hover:text-white hover:bg-zinc-700 h-8 w-8">
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Video Grid */}
              <div className="flex-1 p-3 overflow-hidden">
                {isScreenSharing ? (
                  // Screen share layout
                  <div className="h-full flex flex-col gap-2">
                    <div className="flex-1 relative rounded-lg overflow-hidden bg-zinc-800">
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 left-2 bg-zinc-900/80 px-2 py-1 rounded text-xs flex items-center gap-1.5">
                        <Monitor className="h-3 w-3 text-green-400" />
                        Your screen
                      </div>
                    </div>
                    <div className="h-28 flex gap-2 overflow-x-auto">
                      <VideoTile
                        name="You"
                        isVideoOn={isVideoOn}
                        isMuted={isMuted}
                        audioLevel={audioLevel}
                        videoRef={localVideoRef}
                        isCurrentUser
                        compact
                      />
                      {Array.from(simulatedParticipants.values()).map(({ user, isVideoOn: video, isMuted: muted, audioLevel: level }) => (
                        <VideoTile
                          key={user.id}
                          name={user.name}
                          color={user.color}
                          isVideoOn={video}
                          isMuted={muted}
                          audioLevel={level}
                          isSimulated
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ) : layout === 'grid' ? (
                  // Grid layout
                  <div className={cn(
                    "h-full grid gap-2",
                    totalParticipants <= 1 && "grid-cols-1",
                    totalParticipants === 2 && "grid-cols-2",
                    totalParticipants >= 3 && totalParticipants <= 4 && "grid-cols-2 grid-rows-2",
                    totalParticipants > 4 && "grid-cols-3 grid-rows-2"
                  )}>
                    <VideoTile
                      name="You"
                      isVideoOn={isVideoOn}
                      isMuted={isMuted}
                      audioLevel={audioLevel}
                      videoRef={localVideoRef}
                      isCurrentUser
                      isPinned={pinnedUser === currentUserId}
                      onPin={() => setPinnedUser(pinnedUser === currentUserId ? null : currentUserId)}
                      isHandRaised={isHandRaised}
                    />
                    {Array.from(simulatedParticipants.values()).map(({ user, isVideoOn: video, isMuted: muted, audioLevel: level }) => (
                      <VideoTile
                        key={user.id}
                        name={user.name}
                        color={user.color}
                        isVideoOn={video}
                        isMuted={muted}
                        audioLevel={level}
                        isPinned={pinnedUser === user.id}
                        onPin={() => setPinnedUser(pinnedUser === user.id ? null : user.id)}
                        isSimulated
                      />
                    ))}
                  </div>
                ) : (
                  // Speaker layout
                  <div className="h-full flex flex-col gap-2">
                    <div className="flex-1 relative">
                      <VideoTile
                        name={pinnedUser ? 
                          (pinnedUser === currentUserId ? 'You' : 
                            simulatedParticipants.get(pinnedUser)?.user.name || 'Participant') 
                          : 'You'}
                        isVideoOn={pinnedUser === currentUserId ? isVideoOn : 
                          simulatedParticipants.get(pinnedUser || '')?.isVideoOn ?? isVideoOn}
                        isMuted={pinnedUser === currentUserId ? isMuted :
                          simulatedParticipants.get(pinnedUser || '')?.isMuted ?? isMuted}
                        audioLevel={pinnedUser === currentUserId ? audioLevel :
                          simulatedParticipants.get(pinnedUser || '')?.audioLevel ?? 0}
                        videoRef={pinnedUser === currentUserId ? localVideoRef : undefined}
                        color={pinnedUser && pinnedUser !== currentUserId ? 
                          simulatedParticipants.get(pinnedUser)?.user.color : undefined}
                        isCurrentUser={pinnedUser === currentUserId || !pinnedUser}
                        large
                      />
                    </div>
                    <div className="h-24 flex gap-2 overflow-x-auto">
                      {(!pinnedUser || pinnedUser !== currentUserId) && (
                        <VideoTile
                          name="You"
                          isVideoOn={isVideoOn}
                          isMuted={isMuted}
                          audioLevel={audioLevel}
                          videoRef={localVideoRef}
                          isCurrentUser
                          compact
                          onClick={() => setPinnedUser(currentUserId)}
                        />
                      )}
                      {Array.from(simulatedParticipants.values())
                        .filter(({ user }) => user.id !== pinnedUser)
                        .map(({ user, isVideoOn: video, isMuted: muted, audioLevel: level }) => (
                          <VideoTile
                            key={user.id}
                            name={user.name}
                            color={user.color}
                            isVideoOn={video}
                            isMuted={muted}
                            audioLevel={level}
                            isSimulated
                            compact
                            onClick={() => setPinnedUser(user.id)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar (Chat/Participants) */}
              {(showChat || showParticipants) && (
                <div className="w-80 border-l border-zinc-700 flex flex-col bg-zinc-800/50">
                  <div className="flex border-b border-zinc-700">
                    <button
                      onClick={() => { setShowChat(true); setShowParticipants(false) }}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium transition-colors",
                        showChat ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => { setShowParticipants(true); setShowChat(false) }}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium transition-colors",
                        showParticipants ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      Participants ({totalParticipants})
                    </button>
                  </div>
                  
                  {showChat && (
                    <>
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                          {chatMessages.map(msg => (
                            <div key={msg.id} className={cn(
                              "text-sm",
                              msg.userId === 'system' && "text-zinc-500 text-center text-xs"
                            )}>
                              {msg.userId !== 'system' && (
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={cn(
                                    "font-medium",
                                    msg.userId === currentUserId ? "text-blue-400" : "text-zinc-300"
                                  )}>
                                    {msg.userName}
                                  </span>
                                  <span className="text-xs text-zinc-500">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              <p className="text-zinc-300">{msg.message}</p>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t border-zinc-700">
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Send a message..."
                            className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500"
                          />
                          <Button size="icon" onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {showParticipants && (
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2">
                        {/* Current User */}
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-700/50">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">You</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">You {isHost && '(Host)'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isVideoOn ? <Video className="h-3.5 w-3.5 text-zinc-400" /> : <VideoOff className="h-3.5 w-3.5 text-red-400" />}
                            {isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-zinc-400" />}
                          </div>
                        </div>
                        
                        {/* Simulated Participants */}
                        {Array.from(simulatedParticipants.values()).map(({ user, isVideoOn: video, isMuted: muted }) => (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback 
                                className="text-white text-xs"
                                style={{ backgroundColor: user.color }}
                              >
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1 h-4 border-zinc-600 text-zinc-400">Test</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              {video ? <Video className="h-3.5 w-3.5 text-zinc-400" /> : <VideoOff className="h-3.5 w-3.5 text-red-400" />}
                              {muted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-zinc-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className={cn(
              "bg-zinc-800/90 border-t border-zinc-700 px-4 py-3 transition-all",
              !showControlsBar && "translate-y-full"
            )}>
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className={cn(
                          "h-11 w-11 rounded-full",
                          isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-zinc-700 text-white hover:bg-zinc-600"
                        )}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleVideo}
                        className={cn(
                          "h-11 w-11 rounded-full",
                          !isVideoOn ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-zinc-700 text-white hover:bg-zinc-600"
                        )}
                      >
                        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isVideoOn ? 'Turn off camera' : 'Turn on camera'}</TooltipContent>
                  </Tooltip>
                  
                  {meeting.settings.allowScreenShare && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleScreenShare}
                          className={cn(
                            "h-11 w-11 rounded-full",
                            isScreenSharing ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-zinc-700 text-white hover:bg-zinc-600"
                          )}
                        >
                          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleHandRaise}
                        className={cn(
                          "h-11 w-11 rounded-full",
                          isHandRaised ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-zinc-700 text-white hover:bg-zinc-600"
                        )}
                      >
                        <Hand className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isHandRaised ? 'Lower hand' : 'Raise hand'}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Center - End call */}
                <div className="flex items-center gap-2">
                  {canRecord && meeting.settings.allowRecording && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleRecording}
                          className={cn(
                            "h-11 w-11 rounded-full",
                            isRecording ? "bg-red-500 text-white hover:bg-red-600" : "bg-zinc-700 text-white hover:bg-zinc-600"
                          )}
                        >
                          <Circle className={cn("h-5 w-5", isRecording && "fill-current animate-pulse")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isRecording ? 'Stop recording' : 'Start recording'}</TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={leaveMeeting}
                    className="h-11 px-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <Phone className="h-5 w-5 rotate-[135deg] mr-2" />
                    Leave
                  </Button>
                  
                  {isHost && (
                    <Button
                      variant="ghost"
                      onClick={endMeeting}
                      className="h-11 px-4 rounded-full bg-red-600 text-white hover:bg-red-700"
                    >
                      End for All
                    </Button>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setShowChat(!showChat); setShowParticipants(false) }}
                        className={cn(
                          "h-11 w-11 rounded-full",
                          showChat ? "bg-blue-500/20 text-blue-400" : "bg-zinc-700 text-white hover:bg-zinc-600"
                        )}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chat</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setShowParticipants(!showParticipants); setShowChat(false) }}
                        className={cn(
                          "h-11 w-11 rounded-full relative",
                          showParticipants ? "bg-blue-500/20 text-blue-400" : "bg-zinc-700 text-white hover:bg-zinc-600"
                        )}
                      >
                        <Users className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-xs flex items-center justify-center">
                          {totalParticipants}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Participants</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettingsDialog(true)}
                        className="h-11 w-11 rounded-full bg-zinc-700 text-white hover:bg-zinc-600"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Show/Hide controls toggle */}
            <button
              onClick={() => setShowControlsBar(!showControlsBar)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-zinc-700 px-3 py-1 rounded-t-lg text-zinc-400 hover:text-white"
            >
              {showControlsBar ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite to Meeting</DialogTitle>
            <DialogDescription>
              Share the meeting code or link with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Meeting Code</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mt-1">
                <code className="flex-1 text-lg font-mono font-semibold tracking-wider">
                  {meeting.meetingCode}
                </code>
                <Button size="sm" variant="ghost" onClick={copyMeetingCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Join Link</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mt-1">
                <code className="flex-1 text-sm truncate">
                  {generateJoinLink(meeting.id, 'meeting')}
                </code>
                <Button size="sm" variant="ghost" onClick={copyJoinLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Test Accounts for Multi-User Testing</h4>
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
              <p className="text-xs text-muted-foreground">
                Open in multiple browser tabs or incognito windows to test with different users
              </p>
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
              Your meeting recording is ready to download
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{meeting.title}</p>
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
            <DialogTitle>Meeting Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Video Quality</Label>
                <p className="text-sm text-muted-foreground">HD (720p)</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Mirror Video</Label>
                <p className="text-sm text-muted-foreground">Mirror your camera view</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Noise Suppression</Label>
                <p className="text-sm text-muted-foreground">Reduce background noise</p>
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

// Video Tile Component
interface VideoTileProps {
  name: string
  avatar?: string
  color?: string
  isVideoOn: boolean
  isMuted: boolean
  audioLevel?: number
  videoRef?: React.RefObject<HTMLVideoElement>
  isCurrentUser?: boolean
  isPinned?: boolean
  onPin?: () => void
  isHandRaised?: boolean
  isSimulated?: boolean
  compact?: boolean
  large?: boolean
  onClick?: () => void
}

function VideoTile({
  name,
  avatar,
  color = '#6366F1',
  isVideoOn,
  isMuted,
  audioLevel = 0,
  videoRef,
  isCurrentUser,
  isPinned,
  onPin,
  isHandRaised,
  isSimulated,
  compact,
  large,
  onClick
}: VideoTileProps) {
  const initials = name.split(' ').map(n => n[0]).join('')
  const isSpeaking = audioLevel > 20

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden bg-zinc-800 group",
        compact && "w-32 flex-shrink-0",
        large && "w-full h-full",
        !compact && !large && "aspect-video",
        isSpeaking && "ring-2 ring-green-500",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {isVideoOn && videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            isCurrentUser && "scale-x-[-1]"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className={cn(
              "rounded-full flex items-center justify-center text-white font-semibold",
              compact ? "h-12 w-12 text-sm" : "h-20 w-20 text-xl"
            )}
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        </div>
      )}
      
      {/* Overlay info */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-white font-medium truncate", compact ? "text-xs max-w-[60px]" : "text-sm max-w-[120px]")}>
              {name}
              {isCurrentUser && !compact && ' (You)'}
            </span>
            {isSimulated && (
              <Badge variant="outline" className="text-[8px] px-1 h-3 border-zinc-500 text-zinc-400">Test</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isHandRaised && <Hand className="h-3.5 w-3.5 text-amber-400" />}
            {isMuted && <MicOff className="h-3.5 w-3.5 text-red-400" />}
            {!isVideoOn && <VideoOff className="h-3.5 w-3.5 text-red-400" />}
          </div>
        </div>
      </div>
      
      {/* Pin button */}
      {onPin && !compact && (
        <button
          onClick={(e) => { e.stopPropagation(); onPin() }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      )}
      
      {/* Speaking indicator */}
      {isSpeaking && !isMuted && (
        <div className="absolute top-2 left-2 flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-500 rounded-full animate-pulse"
              style={{ 
                height: `${8 + (i * 4)}px`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
