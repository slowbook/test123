import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption.js';
import { transcriptionService } from '../services/transcription.js';

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
      console.log(`👤 User ${socket.data.user.userId} (${socket.id}) joining room ${roomId}`);
      
      // Get existing users in room
      const socketsInRoom = await io.in(roomId).fetchSockets();
      console.log(`📊 Room ${roomId} currently has ${socketsInRoom.length} users`);
      
      socket.join(roomId);
      socket.data.roomId = roomId;

      // Notify others in the room that new user joined
      socket.to(roomId).emit('user-joined', {
        userId: socket.data.user.userId,
        userName: socket.data.user.name,
        socketId: socket.id,
      });
      
      console.log(`✅ User ${socket.data.user.userId} joined room ${roomId} successfully`);
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ roomId, offer }) => {
      console.log(`📤 Forwarding offer from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('offer', { offer });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ roomId, answer }) => {
      console.log(`📤 Forwarding answer from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('answer', { answer });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      console.log(`📤 Forwarding ICE candidate from ${socket.id} to room ${roomId}`);
      socket.to(roomId).emit('ice-candidate', { candidate });
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

    // Audio stream for transcription (Real-time with Deepgram)
    socket.on('start-transcription', async ({ roomId }) => {
      console.log(`[Transcription] Starting for room: ${roomId}`);
      
      const connection = await transcriptionService.startLiveTranscription(
        roomId,
        (transcriptData) => {
          // Send transcript to all users in room
          io.to(roomId).emit('live-caption', {
            text: transcriptData.text,
            isFinal: transcriptData.isFinal,
            speaker: transcriptData.speaker,
            timestamp: transcriptData.timestamp
          });
          
          // Save final transcripts to database
          if (transcriptData.isFinal) {
            saveTranscriptToDatabase(roomId, transcriptData.text);
          }
        },
        (error) => {
          console.error('[Transcription] Error:', error);
          socket.emit('transcription-error', { message: error.message });
        }
      );
      
      if (connection) {
        socket.emit('transcription-started', { roomId });
      }
    });
    
    // Audio stream data chunks
    socket.on('audio-chunk', async ({ roomId, audioData }) => {
      // Send audio chunk to Deepgram for real-time transcription
      if (transcriptionService.isTranscribing(roomId)) {
        try {
          // Convert base64 to buffer if needed
          const audioBuffer = Buffer.isBuffer(audioData) 
            ? audioData 
            : Buffer.from(audioData, 'base64');
          
          transcriptionService.sendAudioChunk(roomId, audioBuffer);
        } catch (error) {
          console.error('[Audio] Failed to send chunk:', error);
        }
      }
    });
    
    // Stop transcription
    socket.on('stop-transcription', ({ roomId }) => {
      console.log(`[Transcription] Stopping for room: ${roomId}`);
      transcriptionService.stopLiveTranscription(roomId);
      socket.emit('transcription-stopped', { roomId });
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
        
        // Stop transcription for this room if last user
        transcriptionService.stopLiveTranscription(socket.data.roomId);
      }
    });
  });

  // Helper function to save transcript to database
  async function saveTranscriptToDatabase(appointmentId, text) {
    try {
      let transcript = await prisma.transcript.findUnique({
        where: { appointmentId: appointmentId }
      });

      if (transcript) {
        const existingText = decrypt(transcript.content);
        const updatedText = existingText + '\n' + text;
        
        await prisma.transcript.update({
          where: { id: transcript.id },
          data: { content: encrypt(updatedText) }
        });
      } else {
        await prisma.transcript.create({
          data: {
            appointmentId: appointmentId,
            content: encrypt(text)
          }
        });
      }
    } catch (error) {
      console.error('[Database] Transcript save error:', error);
    }
  }

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, cleaning up transcription services');
    transcriptionService.cleanup();
  });

  return io;
};
