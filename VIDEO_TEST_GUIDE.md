# 🎥 Video Consultation Testing Guide

## 🚀 Quick Test Setup (Payment Skipped)

The application is now configured to **skip payment** and **auto-confirm** appointments so you can directly test the WebRTC video consultation feature.

---

## 📋 Step-by-Step Testing

### **Step 1: Login as Patient**
1. Open browser 1 (e.g., Chrome)
2. Go to: `http://localhost:5173`
3. Login with:
   - **Email:** `john.doe@example.com`
   - **Password:** `patient123`

### **Step 2: Book an Appointment**
1. Click **"Book Appointment"** button
2. Fill out the form:
   - Age: `25`
   - Symptoms: `Headache and fever`
   - Health Concern: `General checkup`
   - Specialty: `General Medicine`
   - Doctor: Select **Dr. Sarah Smith**
3. Click **"Book Appointment (Skip Payment)"**
4. You'll see a success alert and be redirected to dashboard
5. **The appointment will show as CONFIRMED immediately**
6. Note the appointment's **room ID** - you'll need this

### **Step 3: Login as Doctor (Different Browser)**
1. Open browser 2 (e.g., Firefox or Chrome Incognito)
2. Go to: `http://localhost:5173`
3. Login with:
   - **Email:** `dr.smith@telehealth.com`
   - **Password:** `doctor123`
4. You should see the pending consultation on the dashboard

### **Step 4: Join Consultation Room**

**Patient (Browser 1):**
1. On dashboard, find your confirmed appointment
2. Click **"Join Consultation"** button
3. Allow camera and microphone permissions when prompted
4. You should see your local video feed in the bottom-right corner

**Doctor (Browser 2):**
1. On dashboard, find the consultation
2. Click **"Join Consultation"** button
3. Allow camera and microphone permissions when prompted
4. You should see your local video feed

### **Step 5: Test WebRTC Connection**
Once both users are in the room:
- ✅ Patient should see doctor's video in main area
- ✅ Doctor should see patient's video in main area
- ✅ Both should see their own video in small preview (bottom-right)
- ✅ Connection status indicator should be green (Connected)

### **Step 6: Test Chat**
1. Type a message in the chat sidebar
2. Click **"Send"** button
3. Message should appear in both browser windows
4. Chat messages are encrypted and saved to database

### **Step 7: Test Live Transcription** (Optional)
- Speak while in the call
- If Deepgram API key is configured, live transcript will appear at bottom-left
- Transcripts are encrypted and saved to database

---

## 🧪 Available Test Accounts

### **Patients:**
```
Email: john.doe@example.com
Password: patient123

Email: jane.smith@example.com
Password: patient123
```

### **Doctors:**
```
Email: dr.smith@telehealth.com (General Medicine)
Password: doctor123

Email: dr.johnson@telehealth.com (Cardiology)
Password: doctor123

Email: dr.williams@telehealth.com (Dermatology)
Password: doctor123

Email: dr.brown@telehealth.com (Pediatrics)
Password: doctor123

Email: dr.davis@telehealth.com (Psychiatry)
Password: doctor123
```

### **Admin:**
```
Email: admin@telehealth.com
Password: admin123
```

---

## 🔧 Troubleshooting

### **Camera/Microphone Not Working:**
1. Check browser permissions (click lock icon in address bar)
2. Make sure no other app is using camera/microphone
3. Try refreshing the page
4. Check browser console for errors (F12)

### **Video Not Connecting:**
1. Make sure both users are in the same room (same roomId)
2. Check that WebSocket is connected (green indicator)
3. Check browser console for WebRTC errors
4. Make sure backend server is running on port 5000

### **Chat Not Working:**
1. Check Socket.io connection status
2. Verify backend server logs show "Connected to signaling server"
3. Refresh both browser windows

### **No Doctors Showing:**
- Doctors were seeded earlier
- Refresh the page or run: `npm run seed` in backend directory

---

## 📊 What Gets Tested

### ✅ **Frontend:**
- React components rendering
- WebRTC media device access
- Peer-to-peer connection establishment
- Socket.io real-time communication
- Chat UI and message sending
- Video stream display

### ✅ **Backend:**
- Express API endpoints
- Prisma database operations
- JWT authentication
- Data encryption/decryption
- Socket.io signaling server
- WebRTC offer/answer/ICE candidate exchange
- Chat message storage
- Real-time transcript updates

### ✅ **Database:**
- MongoDB connection
- Appointment creation (auto-confirmed)
- Payment record (auto-completed)
- Chat message storage (encrypted)
- Transcript storage (encrypted)

---

## 🎯 Expected Results

### **Successful Test Indicators:**
- ✅ Both users see each other's video streams
- ✅ Audio works in both directions
- ✅ Chat messages appear instantly
- ✅ Connection indicator shows "Connected" (green)
- ✅ No console errors in browser
- ✅ Backend logs show successful WebRTC signaling events

### **Backend Console Logs You Should See:**
```
Connected to signaling server
User joined room: [roomId]
WebRTC offer sent
WebRTC answer sent
ICE candidate exchanged
Chat message stored
```

---

## 🔄 To Re-enable Payment (Later)

When you're ready to test with actual payments:

1. **Backend** - Change in `src/routes/appointments.js`:
   ```javascript
   status: 'PENDING', // Change from 'CONFIRMED'
   status: 'PENDING', // Change from 'COMPLETED'
   ```

2. **Frontend** - Change in `src/pages/BookingForm.jsx`:
   ```javascript
   navigate(`/payment/${appointmentId}`) // Redirect to payment
   ```

3. Configure Square API keys in `.env` files

---

## 📞 Quick Commands

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**View Database:**
```bash
cd backend
npx prisma studio
```

**Re-seed Database:**
```bash
cd backend
npm run seed
```

---

**Happy Testing! 🎉**
