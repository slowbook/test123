import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption.js';

const prisma = new PrismaClient();

export const initializeSignalingServer = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room
    socket.on('join-room', async ({ roomId }) => {
      console.log(`User ${socket.data.user.userId} joining room ${roomId}`);
      
      socket.join(roomId);
      socket.data.roomId = roomId;

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.data.user.userId,
        userName: socket.data.user.name,
      });
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('offer', offer);
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('answer', answer);
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    // Chat message
    socket.on('chat-message', async ({ roomId, message }) => {
      try {
        // Save message to database
        const appointment = await prisma.appointment.findFirst({
          where: { roomId },
        });

        if (appointment) {
          const encryptedContent = encrypt(message.content);

          await prisma.chatMessage.create({
            data: {
              appointmentId: appointment.id,
              sender: message.sender,
              content: encryptedContent,
            },
          });
        }

        // Broadcast to room
        socket.to(roomId).emit('chat-message', message);
      } catch (error) {
        console.error('Chat message error:', error);
      }
    });

    // Transcript update from Deepgram
    socket.on('transcript-update', async ({ roomId, text }) => {
      try {
        // Broadcast to room
        socket.to(roomId).emit('transcript-update', text);

        // Save to database
        const appointment = await prisma.appointment.findFirst({
          where: { roomId },
        });

        if (appointment) {
          let transcript = await prisma.transcript.findUnique({
            where: { appointmentId: appointment.id },
          });

          if (transcript) {
            // Decrypt, append, re-encrypt
            const existingText = decrypt(transcript.content);
            const updatedText = existingText + '\n' + text;
            const encryptedText = encrypt(updatedText);

            await prisma.transcript.update({
              where: { id: transcript.id },
              data: { content: encryptedText },
            });
          } else {
            // Create new transcript
            const encryptedText = encrypt(text);
            await prisma.transcript.create({
              data: {
                appointmentId: appointment.id,
                content: encryptedText,
              },
            });
          }
        }
      } catch (error) {
        console.error('Transcript update error:', error);
      }
    });

    // Audio stream for transcription
    socket.on('audio-stream', async (audioData) => {
      // Forward to Deepgram service
      console.log('Received audio stream data');
    });

    // Leave room
    socket.on('leave-room', ({ roomId }) => {
      console.log(`User ${socket.data.user.userId} leaving room ${roomId}`);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', {
        userId: socket.data.user.userId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit('user-left', {
          userId: socket.data.user?.userId,
        });
      }
    });
  });

  return io;
};
