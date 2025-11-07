import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';



class TranscriptionService {
  constructor() {
    this.deepgramClient = deepgramApiKey ? createClient(deepgramApiKey) : null;
    this.openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
    this.activeConnections = new Map(); // Track active Deepgram connections
  }


  async startLiveTranscription(roomId, onTranscript, onError) {
    if (!this.deepgramClient) {
      console.warn('Deepgram API key not configured. Live transcription disabled.');
      if (onError) onError(new Error('Deepgram not configured'));
      return null;
    }

    try {
      console.log(`[Deepgram] Starting live transcription for room: ${roomId}`);
      
      const connection = this.deepgramClient.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true, // Get partial results for real-time feel
        punctuate: true,
        diarize: true, // Speaker detection
        utterance_end_ms: 1000, // Wait 1s before finalizing utterance
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log(`[Deepgram] Connection opened for room: ${roomId}`);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives[0]?.transcript;
        const isFinal = data.is_final;
        const speaker = data.channel?.alternatives[0]?.words?.[0]?.speaker;
        
        if (transcript && transcript.length > 0) {
          console.log(`[Deepgram] ${isFinal ? 'Final' : 'Interim'}: "${transcript}"`);
          
          onTranscript({
            text: transcript,
            isFinal: isFinal,
            speaker: speaker || 0,
            timestamp: new Date().toISOString(),
            confidence: data.channel?.alternatives[0]?.confidence || 0
          });
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error(`[Deepgram] Error in room ${roomId}:`, error);
        if (onError) onError(error);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log(`[Deepgram] Connection closed for room: ${roomId}`);
        this.activeConnections.delete(roomId);
      });

      // Store connection for cleanup
      this.activeConnections.set(roomId, connection);

      return connection;
    } catch (error) {
      console.error('[Deepgram] Failed to start live transcription:', error);
      if (onError) onError(error);
      return null;
    }
  }

  /**
   * Send audio chunk to Deepgram for real-time transcription
   */
  sendAudioChunk(roomId, audioChunk) {
    const connection = this.activeConnections.get(roomId);
    if (connection) {
      connection.send(audioChunk);
    }
  }

  /**
   * Stop live transcription
   */
  stopLiveTranscription(roomId) {
    const connection = this.activeConnections.get(roomId);
    if (connection) {
      console.log(`[Deepgram] Closing connection for room: ${roomId}`);
      connection.finish();
      this.activeConnections.delete(roomId);
    }
  }

  /**
   * POST-CALL TRANSCRIPTION (OpenAI Whisper)
   * For full, accurate transcription of recorded audio
   */
  async transcribeAudioFile(audioFilePath, options = {}) {
    if (!this.openaiClient) {
      console.warn('OpenAI API key not configured. File transcription disabled.');
      throw new Error('OpenAI Whisper not configured');
    }

    try {
      console.log(`[Whisper] Transcribing audio file: ${audioFilePath}`);

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      const audioFile = fs.createReadStream(audioFilePath);

      // Transcribe with OpenAI Whisper
      const transcription = await this.openaiClient.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: options.format || 'verbose_json', // Get timestamps and confidence
        timestamp_granularities: ['word', 'segment'], // Word-level and segment-level timestamps
      });

      console.log(`[Whisper] Transcription complete. Length: ${transcription.text?.length || 0} chars`);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        words: transcription.words || [],
        segments: transcription.segments || [],
      };
    } catch (error) {
      console.error('[Whisper] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * FALLBACK: Use Whisper for live transcription if Deepgram fails
   * Buffers audio chunks and transcribes in batches
   */
  async transcribeAudioBuffer(audioBuffer, options = {}) {
    if (!this.openaiClient) {
      throw new Error('OpenAI Whisper not configured');
    }

    try {
      // Save buffer to temp file
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);

      // Transcribe
      const result = await this.transcribeAudioFile(tempFile, options);

      // Cleanup
      fs.unlinkSync(tempFile);

      return result;
    } catch (error) {
      console.error('[Whisper] Buffer transcription failed:', error);
      throw error;
    }
  }

  /**
   * Get transcription status for a room
   */
  isTranscribing(roomId) {
    return this.activeConnections.has(roomId);
  }

  /**
   * Cleanup all active connections
   */
  cleanup() {
    console.log('[Transcription] Cleaning up all connections');
    for (const [roomId, connection] of this.activeConnections.entries()) {
      connection.finish();
    }
    this.activeConnections.clear();
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();

// Export class for testing
export { TranscriptionService };
