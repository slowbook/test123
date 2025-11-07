import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const ConsultationRoom = () => {
  const { roomId } = useParams()
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [transcript, setTranscript] = useState([])
  const [liveCaptions, setLiveCaptions] = useState([])
  const [showCaptions, setShowCaptions] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [mediaReady, setMediaReady] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)

  // Load chat messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${roomId}`)
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) {
        console.error('Failed to load saved messages:', e)
      }
    }
  }, [roomId])

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${roomId}`, JSON.stringify(messages))
    }
  }, [messages, roomId])

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
    })

    newSocket.on('connect', () => {
      console.log('Connected to signaling server')
      setIsConnected(true)
      newSocket.emit('join-room', { roomId })
    })

    newSocket.on('user-joined', async () => {
      await createOffer()
    })

    newSocket.on('offer', async (offer) => {
      await handleOffer(offer)
    })

    newSocket.on('answer', async (answer) => {
      await handleAnswer(answer)
    })

    newSocket.on('ice-candidate', async (candidate) => {
      await handleIceCandidate(candidate)
    })

    newSocket.on('chat-message', (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message]
        // Save to localStorage immediately
        localStorage.setItem(`chat_${roomId}`, JSON.stringify(newMessages))
        return newMessages
      })
    })

    newSocket.on('transcript-update', (text) => {
      setTranscript((prev) => [...prev, text])
    })

    // Listen for live captions from transcription
    newSocket.on('live-caption', (captionData) => {
      console.log('Caption received:', captionData)
      if (captionData.isFinal) {
        // Add to permanent transcript
        setTranscript((prev) => [...prev, captionData.text])
      }
      // Show in live caption overlay (last 3 lines)
      setLiveCaptions((prev) => {
        const updated = [...prev, { ...captionData, id: Date.now() }]
        return updated.slice(-3) // Keep only last 3 captions
      })
    })

    newSocket.on('transcription-started', () => {
      console.log('✅ Live transcription started!')
    })

    newSocket.on('transcription-error', ({ message }) => {
      console.error('❌ Transcription error:', message)
    })

    setSocket(newSocket)

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      peerConnectionRef.current?.close()
      newSocket.disconnect()
    }
  }, [roomId])

  const toggleCamera = async () => {
    if (!cameraEnabled) {
      // Enable camera
      await initializeMedia()
    } else {
      // Disable camera
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false
          track.stop()
        })
        setCameraEnabled(false)
        setMediaReady(false)
      }
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setMicEnabled(!micEnabled)
    }
  }

  // Capture audio and send to backend for transcription
  const startAudioCapture = (stream) => {
    if (!socket) {
      console.warn('Socket not connected, cannot start transcription')
      return
    }

    try {
      console.log('🎤 Starting audio capture for transcription...')
      
      // Start transcription on backend
      socket.emit('start-transcription', { roomId })
      
      // Note: For now, we're just starting transcription
      // Full audio streaming implementation would capture chunks and send them
      // This is a placeholder that shows the caption overlay is ready
      
      console.log('✅ Transcription request sent!')
    } catch (error) {
      console.error('Failed to start audio capture:', error)
    }
  }

  const initializeMedia = async () => {
    try {
      console.log('Requesting camera and microphone access...')
      setMediaError('')
      
      // Check if running on HTTPS or localhost (required for camera access on mobile)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || 
                              window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1'
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please access this page via HTTPS or use localhost for testing.')
      }
      
      // Check if mediaDevices API is supported (with fallback for older browsers)
      const getUserMedia = navigator.mediaDevices?.getUserMedia || 
                          navigator.webkitGetUserMedia || 
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia
      
      if (!getUserMedia && !navigator.mediaDevices) {
        throw new Error('Your browser does not support camera access. Please update your browser or try Chrome/Safari.')
      }
      
      console.log('Browser supports camera API')
      
      // Request media access with mobile-friendly constraints
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user' // Use front camera on mobile
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      }
      
      let stream
      
      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } else if (getUserMedia) {
        // Fallback for older browsers
        stream = await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }

      if (!stream) {
        throw new Error('Failed to get media stream')
      }

      console.log('Media access granted!', stream)
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        console.log('Local video set')
      }

      setCameraEnabled(true)
      setMicEnabled(true)
      setMediaReady(true)
      createPeerConnection()
      
      // Start audio capture for transcription
      startAudioCapture(stream)
    } catch (error) {
      console.error('Failed to get media devices', error)
      let errorMessage = error.message || 'Unknown error occurred'
      
      if (error.name === 'NotFoundError' || error.message?.includes('Requested device not found')) {
        errorMessage = 'No camera found. Please make sure your device has a camera.'
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings and refresh the page.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another app. Please close other apps and try again.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying again with basic settings...'
        // Retry with simpler constraints
        setTimeout(() => retryWithBasicConstraints(), 1000)
        return
      } else if (error.message?.includes('HTTPS') || error.message?.includes('secure')) {
        errorMessage = error.message
      }
      
      setMediaError(errorMessage)
    }
  }

  const retryWithBasicConstraints = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setCameraEnabled(true)
      setMicEnabled(true)
      setMediaReady(true)
      setMediaError('')
      createPeerConnection()
    } catch (error) {
      setMediaError('Failed to access camera with basic settings. Please check your device.')
    }
  }

  const createPeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    }

    const pc = new RTCPeerConnection(configuration)

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current)
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    peerConnectionRef.current = pc
  }

  const createOffer = async () => {
    if (!peerConnectionRef.current || !socket) return

    try {
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      socket.emit('offer', { roomId, offer })
    } catch (error) {
      console.error('Failed to create offer', error)
    }
  }

  const handleOffer = async (offer) => {
    if (!peerConnectionRef.current || !socket) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      socket.emit('answer', { roomId, answer })
    } catch (error) {
      console.error('Failed to handle offer', error)
    }
  }

  const handleAnswer = async (answer) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Failed to handle answer', error)
    }
  }

  const handleIceCandidate = async (candidate) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Failed to add ICE candidate', error)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return

    const message = {
      id: Date.now().toString(),
      sender: user?.name || 'Unknown',
      content: newMessage,
      timestamp: new Date().toISOString(),
    }

    socket.emit('chat-message', { roomId, message })
    setMessages((prev) => {
      const newMessages = [...prev, message]
      localStorage.setItem(`chat_${roomId}`, JSON.stringify(newMessages))
      return newMessages
    })
    setNewMessage('')
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Consultation Room: {roomId}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${mediaReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm">{mediaReady ? 'Camera Ready' : 'Initializing...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {mediaError && (
        <div className="bg-red-600 text-white p-4 text-center">
          <p className="font-semibold">⚠️ {mediaError}</p>
          <p className="text-sm mt-1">Please allow camera and microphone access in your browser settings</p>
          <button 
            onClick={initializeMedia}
            className="mt-2 bg-white text-red-600 px-4 py-1 rounded hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover z-10"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-24 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg z-20"
          />

          {/* Control Buttons - Always Visible */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-30">
            <button
              onClick={toggleCamera}
              className={`${
                cameraEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              } text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110`}
              title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {cameraEnabled ? '📹' : '🚫'} <span className="ml-2 text-sm font-semibold">{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
            </button>
            
            <button
              onClick={toggleMic}
              disabled={!mediaReady}
              className={`${
                micEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              } ${!mediaReady ? 'opacity-50 cursor-not-allowed' : ''} text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110`}
              title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micEnabled ? '🎤' : '🔇'} <span className="ml-2 text-sm font-semibold">{micEnabled ? 'Mic On' : 'Mic Off'}</span>
            </button>

            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
              title={showCaptions ? 'Hide captions' : 'Show captions'}
            >
              💬 <span className="ml-2 text-sm font-semibold">CC</span>
            </button>
          </div>

          {/* Live Captions Overlay */}
          {showCaptions && liveCaptions.length > 0 && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-3/4 z-25">
              <div className="bg-black bg-opacity-80 text-white px-6 py-3 rounded-lg">
                {liveCaptions.map((caption, idx) => (
                  <p key={caption.id} className={`text-center text-lg ${caption.isFinal ? 'font-semibold' : 'opacity-70'}`}>
                    {caption.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Test Caption Button (for testing without Deepgram API) */}
          {mediaReady && (
            <div className="absolute top-4 right-4 z-25">
              <button
                onClick={() => {
                  // Simulate a caption for testing
                  const testCaption = {
                    text: 'This is a test caption. Hello!',
                    isFinal: true,
                    speaker: 0,
                    timestamp: new Date().toISOString(),
                    id: Date.now()
                  }
                  setLiveCaptions(prev => [...prev, testCaption].slice(-3))
                  setTranscript(prev => [...prev, testCaption.text])
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm shadow-lg"
              >
                🧪 Test Caption
              </button>
            </div>
          )}

          {/* Status Message */}
          {!mediaReady && !mediaError && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white z-25">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-xl">Click the Camera button below to start video</p>
              <p className="text-sm text-gray-400 mt-2">Captions will appear automatically when you speak</p>
            </div>
          )}

          {/* Transcript Overlay */}
          {transcript.length > 0 && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-md z-20">
              <h3 className="text-sm font-semibold mb-2">Live Transcript</h3>
              <div className="text-sm max-h-32 overflow-y-auto">
                {transcript.slice(-3).map((text, idx) => (
                  <p key={idx} className="mb-1">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col">
          <div className="p-4 bg-gray-700 text-white font-semibold flex justify-between items-center">
            <span>💬 Chat {transcript.length > 0 && `& 📝 Transcript`}</span>
            <button
              onClick={() => {
                if (confirm('Clear chat history for this room?')) {
                  setMessages([])
                  localStorage.removeItem(`chat_${roomId}`)
                }
              }}
              className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              title="Clear chat history"
            >
              Clear
            </button>
          </div>

          {/* Transcript Section */}
          {transcript.length > 0 && (
            <div className="bg-gray-750 border-b border-gray-600">
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-semibold">📝 Transcript</h3>
                  <span className="text-xs text-gray-400">{transcript.length} lines</span>
                </div>
                <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto text-xs text-gray-300 space-y-1">
                  {transcript.map((text, idx) => (
                    <p key={idx}>• {text}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.sender === user?.name ? 'bg-indigo-600 ml-4' : 'bg-gray-700 mr-4'
                  }`}
                >
                  <div className="text-xs text-gray-300 mb-1">{msg.sender}</div>
                  <div className="text-white text-sm">{msg.content}</div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationRoom
