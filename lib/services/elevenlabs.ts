import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Ensure ELEVENLABS_API_KEY is in .env
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// A good default "ruthless coach" voice ID would be needed.
// Using a standard one for now (e.g., 'Rachel' or similar common ID).
// In a real app, this should be configurable.
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // "George" - often sounds professional/British/stern

export class VoiceService {
  /**
   * Streams audio from text.
   * @param text - The text to speak.
   * @returns A readable stream of the audio.
   */
  static async streamAudio(text: string): Promise<ReadableStream<any>> {
    try {
      const audioStream = await client.textToSpeech.convert(
        DEFAULT_VOICE_ID, // First argument is voice_id
        { // Second argument is the options object
          text,
          modelId: "eleven_turbo_v2_5", // Low latency model
          outputFormat: "mp3_44100_128",
        }
      );

      return audioStream as unknown as ReadableStream<any>;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }
}

