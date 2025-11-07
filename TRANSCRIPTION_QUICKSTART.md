# 🎙️ Transcription Quick Reference

## How It Works (Simple Explanation)

### Real-Time Captions (Deepgram) 📹
```
Person talks → Microphone → Internet → Deepgram AI → Captions (0.3s)
```
**Use:** Live subtitles during video call

### Full Transcript (OpenAI Whisper) 📄
```
Call ends → Saved audio file → OpenAI → Complete transcript
```
**Use:** Medical records after call

---

## Setup (2 minutes)

### 1. Get API Keys
- **Deepgram:** https://console.deepgram.com (Free $200 credit)
- **OpenAI:** https://platform.openai.com/api-keys

### 2. Add to `.env`
```bash
DEEPGRAM_API_KEY=your_key_here
OPENAI_API_KEY=sk-your_key_here
```

### 3. Restart Server
```bash
cd backend
npm run dev
```

---

## Features

| What It Does | How It Helps |
|-------------|--------------|
| 🎯 Real-time captions | Deaf patients can "hear" |
| 🗣️ Speaker detection | Know who said what |
| 📝 Auto note-taking | Doctors don't need to type |
| 🔒 HIPAA encryption | Secure medical records |
| 🌍 99 languages | International patients |
| 💾 Auto-save | Never lose transcripts |

---

## Cost
- **1 hour video call:** $0.62
- **Free tier:** 45 hours free (Deepgram)
- **Scale:** ~$500/month for 1000 hours

---

## Already Integrated! ✅

Your code already has:
- ✅ `transcriptionService` in backend
- ✅ Socket.io events configured
- ✅ Database storage with encryption
- ✅ Error handling

**Just add API keys and it works!**
