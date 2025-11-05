import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY || '';

export class DeepgramService {
  constructor() {
    this.client = createClient(deepgramApiKey);
  }

  async transcribeAudio(audioStream, onTranscript) {
    try {
      const connection = this.client.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives[0]?.transcript;
        if (transcript && transcript.length > 0) {
          onTranscript(transcript);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
      });

      return connection;
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw error;
    }
  }
}

export const deepgramService = new DeepgramService();
