import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Ensure ELEVENLABS_API_KEY is in .env
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const DEFAULT_VOICE_ID = "2582IphrnSeCHztk7SEW"; // "Alastair Savage" - Scottish accent

export class VoiceService {
  /**
   * Streams audio from text.
   * @param text - The text to speak.
   * @returns A readable stream of the audio.
   */
  static async streamAudio(text: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const audioStream = await client.textToSpeech.convert(DEFAULT_VOICE_ID, {
        text,
        modelId: "eleven_turbo_v2_5", // Low latency model
        outputFormat: "mp3_44100_192",
      });

      return audioStream as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }
}
