# 🎙️ Speech-to-Text Transcription Guide

## Overview

Your telehealth app uses **TWO transcription methods** to convert speech to text:

### 1. **Deepgram** - Real-time Live Captions 📹
- Used DURING the video consultation
- Provides instant captions as people speak
- Low latency (~300ms)
- Shows live subtitles on screen

### 2. **OpenAI Whisper** - Post-Call Full Transcript 📄
- Used AFTER the consultation ends
- Transcribes recorded audio file
- Higher accuracy
- Generates complete medical records

---

## 🔄 How It Works

### During Video Call (Deepgram)

```
Patient/Doctor Speaks 
    ↓
Microphone captures audio
    ↓
Audio chunks sent to backend via Socket.io
    ↓
Deepgram API processes in real-time
    ↓
Captions appear on screen (300ms delay)
    ↓
Saved to database (encrypted)
```

**Features:**
- ✅ Live captions for deaf/hard-of-hearing patients
- ✅ Real-time speech recognition
- ✅ Speaker diarization (identifies who's talking)
- ✅ Punctuation and formatting
- ✅ Multiple language support

### After Call (OpenAI Whisper)

```
Consultation ends
    ↓
Audio recording saved to file
    ↓
File sent to OpenAI Whisper API
    ↓
Full transcript generated
    ↓
Saved as medical record (HIPAA-compliant, encrypted)
```

**Features:**
- ✅ Higher accuracy than real-time
- ✅ Word-level timestamps
- ✅ Medical terminology recognition
- ✅ Multi-language support (99 languages)
- ✅ Secure storage with encryption

---

## 📡 Socket Events

### Frontend → Backend

```javascript
// Start live transcription
socket.emit('start-transcription', { roomId: appointmentId })

// Send audio chunks (every 250ms)
socket.emit('audio-chunk', { 
  roomId: appointmentId, 
  audioData: audioBuffer // WebM audio format
})

// Stop transcription
socket.emit('stop-transcription', { roomId: appointmentId })
```

### Backend → Frontend

```javascript
// Transcription started successfully
socket.on('transcription-started', ({ roomId }) => {
  console.log('Live captions enabled!')
})

// Live caption received (every ~300ms)
socket.on('live-caption', ({ text, isFinal, speaker, timestamp }) => {
  // Display caption on screen
  if (isFinal) {
    // Permanent caption
    addToTranscript(text)
  } else {
    // Temporary preview
    showInterimCaption(text)
  }
})

// Error handling
socket.on('transcription-error', ({ message }) => {
  console.error('Transcription failed:', message)
})
```

---

## 🔧 Setup Instructions

### 1. Get API Keys

#### Deepgram (Real-time)
1. Go to [https://console.deepgram.com/](https://console.deepgram.com/)
2. Sign up for free account
3. Create new project
4. Generate API key
5. Add to `.env`:
   ```
   DEEPGRAM_API_KEY=your_deepgram_key_here
   ```

#### OpenAI (Post-call)
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your_openai_key_here
   ```

### 2. Install Dependencies

```bash
cd backend
npm install
```

The following packages are already included:
- `@deepgram/sdk` - Deepgram client
- `openai` - OpenAI client
- `socket.io` - Real-time communication

### 3. Configure Frontend

Update `ConsultationRoom.jsx` to enable audio streaming:

```javascript
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Add audio capture
const mediaRecorderRef = useRef(null)

// Start capturing audio when camera starts
const startAudioCapture = () => {
  if (localStreamRef.current) {
    const options = { mimeType: 'audio/webm' }
    const recorder = new MediaRecorder(localStreamRef.current, options)
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket) {
        // Convert to base64 and send
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1]
          socket.emit('audio-chunk', {
            roomId,
            audioData: base64Audio
          })
        }
        reader.readAsDataURL(event.data)
      }
    }
    
    // Send audio chunks every 250ms
    recorder.start(250)
    mediaRecorderRef.current = recorder
    
    // Start transcription
    socket.emit('start-transcription', { roomId })
  }
}

// Listen for captions
useEffect(() => {
  if (socket) {
    socket.on('live-caption', (data) => {
      setTranscript(prev => {
        if (data.isFinal) {
          return [...prev, data.text]
        }
        return prev
      })
    })
  }
}, [socket])
```

---

## 💰 Pricing

### Deepgram
- **Free Tier:** $200 credit (45 hours of audio)
- **Pay-as-you-go:** $0.0043/minute (~$0.26/hour)
- **Real-time pricing:** Same as pre-recorded

### OpenAI Whisper
- **Pricing:** $0.006/minute ($0.36/hour)
- **No free tier**
- **99 languages supported**

### Cost Example (1-hour consultation):
- Deepgram (live captions): **$0.26**
- Whisper (full transcript): **$0.36**
- **Total: $0.62 per hour**

---

## 🎯 Use Cases

### During Call (Deepgram)
1. **Accessibility** - Deaf/hard-of-hearing patients
2. **Note-taking** - Real-time consultation notes
3. **Multi-language** - Translate conversations
4. **Keyword triggers** - Alert on emergency words

### After Call (Whisper)
1. **Medical Records** - Complete transcript for EHR
2. **Compliance** - HIPAA-compliant documentation
3. **Review** - Doctors review what was discussed
4. **Billing** - CPT code extraction from conversation

---

## 🔒 Security & Compliance

### HIPAA Compliance
- ✅ All transcripts encrypted (AES-256) before storage
- ✅ Deepgram is HIPAA-compliant (sign BAA)
- ✅ OpenAI Whisper API is HIPAA-compliant
- ✅ Audio never stored unencrypted
- ✅ Database encryption at rest
- ✅ TLS 1.3 for transmission

### Best Practices
1. **Get consent** - Inform patients recording is happening
2. **Retain minimum** - Delete recordings after transcription
3. **Audit logs** - Track who accessed transcripts
4. **Access control** - Only authorized users see transcripts

---

## 🐛 Troubleshooting

### No captions appearing
```javascript
// Check browser console for errors
console.log('Socket connected:', socket.connected)
console.log('Transcription active:', transcriptionActive)

// Verify microphone is working
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Mic works!'))
  .catch(err => console.error('Mic error:', err))
```

### Deepgram API key invalid
```bash
# Test API key in terminal
curl -X POST https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @test.wav
```

### OpenAI rate limit
- OpenAI has rate limits: 3 requests/minute (free tier)
- Upgrade to paid tier for higher limits
- Queue transcription requests if needed

---

## 📊 Testing

### Test Live Captions
1. Start video consultation
2. Open browser console
3. Check for Socket events:
   ```
   [Deepgram] Connection opened for room: 123
   [Deepgram] Interim: "Hello"
   [Deepgram] Final: "Hello, how are you feeling today?"
   ```

### Test Post-Call Transcript
```javascript
// In backend, test Whisper API
import { transcriptionService } from './services/transcription.js'

const result = await transcriptionService.transcribeAudioFile(
  './test-audio.mp3'
)

console.log('Transcript:', result.text)
console.log('Duration:', result.duration, 'seconds')
console.log('Language:', result.language)
```

---

## 🚀 Advanced Features

### Speaker Identification
```javascript
socket.on('live-caption', ({ text, speaker }) => {
  const speakerName = speaker === 0 ? 'Doctor' : 'Patient'
  displayCaption(`${speakerName}: ${text}`)
})
```

### Language Detection
```javascript
// Whisper auto-detects language
const result = await transcriptionService.transcribeAudioFile(
  './spanish-audio.mp3'
)
console.log('Detected language:', result.language) // 'es'
```

### Custom Vocabulary
```javascript
// Deepgram can learn medical terms
const connection = deepgramClient.listen.live({
  model: 'nova-2',
  keywords: ['hypertension:3', 'diabetes:3', 'prescription:2']
  // Number is weight/importance
})
```

---

## 📝 Summary

| Feature | Deepgram | OpenAI Whisper |
|---------|----------|----------------|
| **Use Case** | Live captions | Post-call transcript |
| **Latency** | ~300ms | N/A (batch) |
| **Accuracy** | 85-90% | 95-99% |
| **Cost** | $0.26/hour | $0.36/hour |
| **Languages** | 36 | 99 |
| **HIPAA** | ✅ Yes | ✅ Yes |
| **Real-time** | ✅ Yes | ❌ No |

**Recommendation:** Use both!
- Deepgram for live experience
- Whisper for medical records

---

## 🎉 You're All Set!

Your transcription system is ready to:
1. ✅ Show live captions during video calls
2. ✅ Generate accurate medical transcripts
3. ✅ Store encrypted records securely
4. ✅ Comply with HIPAA regulations

Need help? Check the console logs or contact support!
