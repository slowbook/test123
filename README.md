# 🩺 Telehealth Application

A full-stack **Telehealth Platform** that allows patients to consult doctors online through **real-time video calls**, **secure chats**, and **easy payments**.

> ⚙️ **Note:** This project was built with the help of AI tools for documentation and structure, but **the entire logic, design, and implementation are our own.**
> ✅ **Backend is deployed on Render**
> ✅ **Frontend is deployed on Vercel**

---

## 🧠 Overview

This web app connects **patients** and **doctors** for online consultations — similar to an in-person clinic experience.

**Main Features:**

* Secure login and authentication (for patients, doctors, and admin)
* Book and pay for appointments
* Real-time video consultation using WebRTC
* Live chat and transcription
* Encrypted medical data for privacy
* Admin dashboard for system monitoring

---

## 🏷️ Tech Stack

### **Frontend (Vercel)**

* React (Vite)
* Tailwind CSS
* Axios (for API calls)
* Socket.io-client (real-time communication)
* WebRTC (for video/audio streaming)

### **Backend (Render)**

* Node.js + Express
* Prisma ORM with MongoDB
* JWT Authentication
* Square Payments API
* Deepgram / OpenAI Whisper for transcription
* AES encryption for patient data

---

## 📁 Folder Structure (Simplified)

```
telehealth/
├── frontend/        # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── backend/         # Node.js API
    ├── src/
    │   ├── routes/
    │   ├── middleware/
    │   ├── services/
    │   ├── socket/
    │   └── server.js
    ├── prisma/schema.prisma
    └── package.json
```

---

## 🚀 How to Run Locally

### 1️⃣ Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2️⃣ Set up environment files

Copy `.env.template` files from both frontend and backend folders and fill in your API keys and URLs.

### 3️⃣ Run development servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

Frontend runs at **[http://localhost:3000](http://localhost:3000)**
Backend runs at **[http://localhost:5000](http://localhost:5000)**

---

## 🔐 Security

* Patient data encrypted using AES-256
* JWT authentication with role-based access
* Secure WebSocket (Socket.io) connections
* Audit logs for admin actions

---

## 💳 Payment Integration

* Integrated with **Square Payments**
* Patients pay before consultation
* Payment and receipt handled securely

---

## 📵 Video Consultation Flow

1. Patient books an appointment
2. Doctor accepts the request
3. Secure WebRTC video call starts
4. Real-time chat and transcription enabled
5. Session data securely saved to database

---

## 👨‍⚕️ Admin Dashboard

Admins can:

* View/manage all users and doctors
* Monitor appointments and payments
* Check system logs and analytics

---

## ⚡ Deployment

* **Frontend:** [Vercel](https://vercel.com/)
* **Backend:** [Render](https://render.com/)
* **Database:** MongoDB Atlas

---

## 🧯 License & Purpose

This project is made for **educational and demonstration purposes** to showcase full-stack development, WebRTC integration, and secure health data handling.

---

**Built with ❤️ using AI-assisted tools, but powered by our own ideas and logic.**
