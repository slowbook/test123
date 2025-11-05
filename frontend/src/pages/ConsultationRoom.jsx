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
  const [isConnected, setIsConnected] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [mediaReady, setMediaReady] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)

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
      setMessages((prev) => [...prev, message])
    })

    newSocket.on('transcript-update', (text) => {
      setTranscript((prev) => [...prev, text])
    })

    setSocket(newSocket)

    // Don't auto-initialize media - wait for user action
    // initializeMedia()

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      peerConnectionRef.current?.close()
      newSocket.disconnect()
    }
  }, [roomId])

  const requestMediaAccess = async () => {
    setPermissionRequested(true)
    await initializeMedia()
  }

  const initializeMedia = async () => {
    try {
      console.log('Requesting camera and microphone access...')
      setMediaError('')
      
      // Check if devices are available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideo = devices.some(device => device.kind === 'videoinput')
      const hasAudio = devices.some(device => device.kind === 'audioinput')
      
      console.log('Available devices:', { hasVideo, hasAudio, devices })
      
      if (!hasVideo && !hasAudio) {
        throw new Error('No camera or microphone detected. Please connect a webcam or use a device with a built-in camera.')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false,
        audio: hasAudio,
      })

      console.log('Media access granted!', stream)
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        console.log('Local video set')
      }

      setMediaReady(true)
      createPeerConnection()
    } catch (error) {
      console.error('Failed to get media devices', error)
      let errorMessage = `${error.name}: ${error.message}`
      
      if (error.name === 'NotFoundError' || error.message.includes('Requested device not found')) {
        errorMessage = 'No camera or microphone found. Please connect a webcam or use a device with a camera.'
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps and try again.'
      }
      
      setMediaError(errorMessage)
      alert(`⚠️ Camera/Microphone Error\n\n${errorMessage}\n\nFor testing purposes, you can use a virtual camera or mobile device with a built-in camera.`)
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
    setMessages((prev) => [...prev, message])
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
          {!permissionRequested && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900 z-50">
              <div className="text-center">
                <div className="text-8xl mb-6">🎥</div>
                <h2 className="text-3xl font-bold mb-4">Ready to Start Video Call?</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                  Click the button below to grant camera and microphone access.
                  You'll need to allow permissions in your browser.
                </p>
                <button 
                  onClick={requestMediaAccess}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-xl font-semibold transition shadow-lg cursor-pointer"
                >
                  🎥 Enable Camera & Microphone
                </button>
              </div>
            </div>
          )}
          
          {permissionRequested && !mediaReady && !mediaError && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-40">
              <div className="text-center">
                <div className="animate-pulse text-6xl mb-4">📹</div>
                <p className="text-xl">Requesting camera access...</p>
                <p className="text-sm text-gray-400 mt-2">Please allow permissions when prompted</p>
              </div>
            </div>
          )}
          
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
            className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg z-20"
          />

          {/* Transcript Overlay */}
          {transcript.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg max-w-md">
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
          <div className="p-4 bg-gray-700 text-white font-semibold">Chat</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.sender === user?.name ? 'bg-indigo-600 ml-4' : 'bg-gray-700 mr-4'
                }`}
              >
                <div className="text-xs text-gray-300 mb-1">{msg.sender}</div>
                <div className="text-white text-sm">{msg.content}</div>
              </div>
            ))}
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
