"use client"

// WebRTC Service for Real-Time Audio/Video Communication
// This service handles peer-to-peer connections for Spaces and Video Meetings

export interface MediaStreamState {
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  screenStream: MediaStream | null
}

export interface RecordingState {
  isRecording: boolean
  mediaRecorder: MediaRecorder | null
  recordedChunks: Blob[]
  startTime: number | null
  duration: number
}

// Test User Accounts for multi-user testing
export interface TestUser {
  id: string
  name: string
  username: string
  avatar?: string
  color: string
  role: 'host' | 'co-host' | 'speaker' | 'listener' | 'participant'
}

export const TEST_USERS: TestUser[] = [
  {
    id: 'test-user-1',
    name: 'Ahmad Developer',
    username: 'ahmad_dev',
    color: '#3B82F6',
    role: 'host'
  },
  {
    id: 'test-user-2',
    name: 'Fatima Tester',
    username: 'fatima_test',
    color: '#10B981',
    role: 'speaker'
  },
  {
    id: 'test-user-3',
    name: 'Omar QA',
    username: 'omar_qa',
    color: '#F59E0B',
    role: 'listener'
  },
  {
    id: 'test-user-4',
    name: 'Aisha Admin',
    username: 'aisha_admin',
    color: '#EF4444',
    role: 'co-host'
  }
]

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
}

// Supported MIME types for recording
const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
]

const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4'
]

function getSupportedMimeType(types: string[]): string {
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return types[0]
}

// Media Stream Management
export class MediaManager {
  private localStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  
  async getAudioStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })
      return this.localStream
    } catch (error) {
      console.error('[v0] Failed to get audio stream:', error)
      throw error
    }
  }

  async getVideoStream(options?: { facingMode?: 'user' | 'environment' }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: options?.facingMode || 'user'
        }
      })
      return this.localStream
    } catch (error) {
      console.error('[v0] Failed to get video stream:', error)
      throw error
    }
  }

  async getScreenStream(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: true
      })
      return this.screenStream
    } catch (error) {
      console.error('[v0] Failed to get screen stream:', error)
      throw error
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }

  stopScreenStream(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = null
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getScreenShareStream(): MediaStream | null {
    return this.screenStream
  }
}

// Recording Manager
export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private startTime: number = 0
  private onDataAvailable?: (blob: Blob) => void

  startRecording(
    stream: MediaStream, 
    type: 'audio' | 'video',
    onDataAvailable?: (blob: Blob) => void
  ): boolean {
    try {
      const mimeType = getSupportedMimeType(
        type === 'audio' ? AUDIO_MIME_TYPES : VIDEO_MIME_TYPES
      )

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: type === 'video' ? 2500000 : undefined,
        audioBitsPerSecond: 128000
      })

      this.recordedChunks = []
      this.onDataAvailable = onDataAvailable

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000) // Capture in 1-second chunks
      this.startTime = Date.now()
      
      console.log('[v0] Recording started with MIME type:', mimeType)
      return true
    } catch (error) {
      console.error('[v0] Failed to start recording:', error)
      return false
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm'
        })
        this.onDataAvailable?.(blob)
        console.log('[v0] Recording stopped, blob size:', blob.size)
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  getRecordingDuration(): number {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  downloadRecording(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Audio Level Analyzer for speaking indicators
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private animationFrame: number | null = null

  start(stream: MediaStream, onLevelChange: (level: number) => void): void {
    try {
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.source = this.audioContext.createMediaStreamSource(stream)
      
      this.analyser.fftSize = 256
      this.source.connect(this.analyser)
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

      const analyze = () => {
        if (this.analyser && this.dataArray) {
          this.analyser.getByteFrequencyData(this.dataArray)
          const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length
          const normalizedLevel = Math.min(100, Math.round(average))
          onLevelChange(normalizedLevel)
        }
        this.animationFrame = requestAnimationFrame(analyze)
      }
      
      analyze()
    } catch (error) {
      console.error('[v0] Failed to start audio analyzer:', error)
    }
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
    this.audioContext = null
    this.analyser = null
    this.source = null
  }
}

// Simulated Peer Connection for demo purposes
// In production, this would use actual WebRTC peer connections with a signaling server
export class SimulatedPeerManager {
  private connections: Map<string, { user: TestUser; audioLevel: number }> = new Map()
  private intervalId: NodeJS.Timeout | null = null

  addPeer(user: TestUser): void {
    this.connections.set(user.id, { user, audioLevel: 0 })
  }

  removePeer(userId: string): void {
    this.connections.delete(userId)
  }

  getPeers(): TestUser[] {
    return Array.from(this.connections.values()).map(c => c.user)
  }

  // Simulate random audio activity for demo
  startSimulation(onUpdate: (userId: string, audioLevel: number) => void): void {
    this.intervalId = setInterval(() => {
      this.connections.forEach((connection, id) => {
        if (connection.user.role === 'speaker' || connection.user.role === 'host' || connection.user.role === 'co-host') {
          // Simulate speaking with random levels
          const isSpeaking = Math.random() > 0.6
          const level = isSpeaking ? Math.floor(Math.random() * 80) + 20 : 0
          connection.audioLevel = level
          onUpdate(id, level)
        }
      })
    }, 200)
  }

  stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

// Utility functions
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function generateRoomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function generateJoinLink(roomId: string, type: 'space' | 'meeting'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/feed/${type}/${roomId}`
  }
  return `/feed/${type}/${roomId}`
}
