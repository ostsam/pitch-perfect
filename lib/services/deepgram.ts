import { createClient } from "@deepgram/sdk";

export class DeepgramService {
  /**
   * Returns the Deepgram API key for the client to use.
   * Note: In a production app with "Admin" scoped keys, we would generate a temporary key here.
   * For this hackathon/demo, we are passing the key directly to ensure the "Usage" scoped key works immediately.
   */
  static async getEphemeralKey() {
    const key = process.env.DEEPGRAM_API_KEY;

    if (!key) {
      console.error(
        "❌ DEEPGRAM_API_KEY is missing from environment variables",
      );
      throw new Error("Deepgram API key not configured");
    }

    // Return the key in the structure expected by the frontend
    return { key };
  }
}
