/**
 * Deepgram Service Configuration
 * 
 * STT: Deepgram Speech-to-Text
 * TTS: Deepgram Aura TTS
 * LLM: OpenAI (for roast generation)
 */

export interface DeepgramConfig {
  apiKey: string;
  openaiApiKey?: string;
}

export const DEEPGRAM_ENDPOINTS = {
  STT: "https://api.deepgram.com/v1/listen",
  TTS: "https://api.deepgram.com/v1/speak",
} as const;

/**
 * Parakeet STT Service Client
 * Converts audio to text using HTTP streaming
 */
export class ParakeetSTTService {
  private baseUrl: string;
  private apiKey: string;
  private isActive = false;
  private onTranscriptCallback?: (text: string) => void;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: HathoraConfig) {
    this.baseUrl = config.sttUrl || HATHORA_ENDPOINTS.STT;
    this.apiKey = config.apiKey;
  }

  async connect(onTranscript: (text: string) => void): Promise<void> {
    this.onTranscriptCallback = onTranscript;
    this.isActive = true;
    console.log('✅ Parakeet STT service ready');
    console.log('📍 Endpoint:', this.baseUrl);
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'parakeet-ctc-1.1b');

    try {
      // Try OpenAI-compatible endpoint first
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // If that fails, try direct endpoint
        const directResponse = await fetch(`${this.baseUrl.replace('/v1', '')}/transcribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: formData,
        });

        if (!directResponse.ok) {
          throw new Error(`STT failed: ${directResponse.statusText} (${directResponse.status})`);
        }

        const data = await directResponse.json();
        return data.text || data.transcription || '';
      }

      const data = await response.json();
      return data.text || data.transcription || '';
    } catch (err) {
      console.error('Transcription error:', err);
      throw err;
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    // Collect audio chunks for batch processing
    if (this.isActive) {
      const blob = new Blob([audioData], { type: 'audio/webm' });
      this.audioChunks.push(blob);
      
      // Process every 3 seconds of audio
      if (this.audioChunks.length >= 30) { // ~3 seconds at 100ms chunks
        this.processChunks();
      }
    }
  }

  private async processChunks(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    const combinedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = [];

    try {
      const text = await this.transcribeAudio(combinedBlob);
      if (text && this.onTranscriptCallback) {
        this.onTranscriptCallback(text);
      }
    } catch (err) {
      console.error('Failed to process audio chunks:', err);
    }
  }

  disconnect(): void {
    this.isActive = false;
    if (this.audioChunks.length > 0) {
      this.processChunks(); // Process remaining chunks
    }
    console.log('🛑 Parakeet STT disconnected');
  }

  get connected(): boolean {
    return this.isActive;
  }
}

/**
 * Kokoro TTS Service Client
 * Converts text to speech audio
 */
export class KokoroTTSService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: HathoraConfig) {
    this.baseUrl = config.ttsUrl || HATHORA_ENDPOINTS.TTS;
    this.apiKey = config.apiKey;
  }

  async synthesize(text: string, voice?: string): Promise<ArrayBuffer> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        voice: voice || 'default',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS error response:', errorText);
      throw new Error(`TTS failed: ${response.statusText} (${response.status})`);
    }

    return response.arrayBuffer();
  }

  async synthesizeStream(text: string, onChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(value.buffer);
    }
  }
}

/**
 * Hathora LLM Service Client
 * OpenAI-compatible LLM interface for Qwen models
 */
export class HathoraLLMService {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: HathoraConfig & { model?: string }) {
    this.baseUrl = config.llmUrl || HATHORA_ENDPOINTS.LLM;
    this.apiKey = config.apiKey;
    // Hathora uses model=None in Pipecat, so we'll use empty string or a default
    this.model = config.model || 'hathora-qwen';
  }

  async chat(messages: Array<{ role: string; content: string }>, stream = false): Promise<any> {
    console.log('🤖 LLM Request:', { endpoint: this.baseUrl, messages, stream });
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream,
        temperature: 0.9,
        max_tokens: 100, // Keep roasts short
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM error response:', errorText);
      throw new Error(`LLM request failed: ${response.statusText} (${response.status})`);
    }

    if (stream) {
      return response.body;
    }

    const data = await response.json();
    console.log('🤖 LLM Response:', data);
    return data;
  }

  async generateRoast(context: {
    transcript: string;
    emotion?: string;
    slideNumber?: number;
    triggerType: string;
  }): Promise<string> {
    const systemPrompt = `You are "The Pitch Exorcist" - a brutal AI that interrupts bad pitches with savage roasts. 
Keep responses SHORT (1-2 sentences max). Be funny but cutting. Reference the specific issue.`;

    const userPrompt = `Interrupt this pitch:
- What they said: "${context.transcript}"
- Their emotion: ${context.emotion || 'unknown'}
- Current slide: ${context.slideNumber || 'unknown'}
- Trigger: ${context.triggerType}

Roast them NOW:`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      return response.choices[0]?.message?.content || "Stop right there!";
    } catch (err) {
      console.error('Failed to generate roast:', err);
      throw err;
    }
  }

  async *generateRoastStream(context: {
    transcript: string;
    emotion?: string;
    slideNumber?: number;
    triggerType: string;
  }): AsyncGenerator<string> {
    const systemPrompt = `You are "The Pitch Exorcist" - a brutal AI that interrupts bad pitches with savage roasts. 
Keep responses SHORT (1-2 sentences max). Be funny but cutting. Reference the specific issue.`;

    const userPrompt = `Interrupt this pitch:
- What they said: "${context.transcript}"
- Their emotion: ${context.emotion || 'unknown'}
- Current slide: ${context.slideNumber || 'unknown'}
- Trigger: ${context.triggerType}

Roast them NOW:`;

    const stream = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], true);

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

      for (const line of lines) {
        const data = line.replace('data:', '').trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch (err) {
          // Skip malformed JSON
        }
      }
    }
  }
}
