/**
 * Hathora Voice Client for Pitch Perfect
 * Integrates with Qwen/Qwen3-Omni-30B-A3B-Instruct via Hathora
 */

export interface HathoraConfig {
  baseUrl: string;
  apiKey: string;
  model?: string;
}

export interface InterruptTrigger {
  type: 'keyword' | 'speed' | 'contradiction' | 'emotion';
  value: string | number;
  confidence: number;
}

export interface PitchContext {
  deckContent?: string;
  currentSlide?: number;
  transcript?: string;
  faceEmotion?: string;
  emotionConfidence?: number;
}

/**
 * Pre-cached interrupt audio files for 0ms latency
 */
export const INTERRUPT_FILLERS = [
  { trigger: 'buzzword', audio: '/Users/tanishvardhineni/Documents/pitch-hackathon/pitch-perfect/lib/audio/Recording-94.mp4', text: 'Stop right there!' },
  { trigger: 'speed', audio: '/Users/tanishvardhineni/Documents/pitch-hackathon/pitch-perfect/lib/audio/Recording-94.mp4', text: 'Slow down!' },
  { trigger: 'contradiction', audio: '/Users/tanishvardhineni/Documents/pitch-hackathon/pitch-perfect/lib/audio/Recording-94.mp4', text: 'Hold on a second!' },
  { trigger: 'weak', audio: '/Users/tanishvardhineni/Documents/pitch-hackathon/pitch-perfect/lib/audio/Recording-94.mp4', text: 'Seriously?' },
  { trigger: 'emotion', audio: '/Users/tanishvardhineni/Documents/pitch-hackathon/pitch-perfect/lib/audio/Recording-94.mp4', text: 'Wait!' },
] as const;

export class HathoraVoiceClient {
  private config: HathoraConfig;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private audioQueue: AudioBuffer[] = [];
  private currentAudioContext: AudioContext | null = null;
  private interruptCache = new Map<string, HTMLAudioElement>();

  constructor(config: HathoraConfig) {
    this.config = config;
    this.preloadInterrupts();
  }

  /**
   * Pre-load interrupt audio files for instant playback
   */
  private async preloadInterrupts() {
    for (const interrupt of INTERRUPT_FILLERS) {
      const audio = new Audio(interrupt.audio);
      audio.preload = 'auto';
      await audio.load();
      this.interruptCache.set(interrupt.trigger, audio);
    }
    console.log('✅ Interrupt audio files preloaded');
  }

  /**
   * Connect to Hathora WebSocket for real-time voice streaming
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.baseUrl.replace('https://', 'wss://') + '/ws');
        
        this.ws.onopen = () => {
          console.log('🔌 Connected to Hathora');
          this.isConnected = true;
          
          // Send authentication
          this.ws?.send(JSON.stringify({
            type: 'auth',
            apiKey: this.config.apiKey,
            model: this.config.model || 'Qwen/Qwen3-Omni-30B-A3B-Instruct',
          }));
          
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('❌ Hathora connection error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from Hathora');
          this.isConnected = false;
        };

        this.ws.onmessage = this.handleMessage.bind(this);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from Hathora
   */
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'audio_chunk':
          this.handleAudioChunk(data.audio);
          break;
        case 'transcript':
          console.log('🎤 AI Response:', data.text);
          break;
        case 'error':
          console.error('❌ Hathora error:', data.message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Handle audio chunk from AI response
   */
  private async handleAudioChunk(base64Audio: string) {
    if (!this.currentAudioContext) {
      this.currentAudioContext = new AudioContext();
    }

    const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    const audioBuffer = await this.currentAudioContext.decodeAudioData(audioData.buffer);
    
    this.audioQueue.push(audioBuffer);
    this.playNextAudio();
  }

  /**
   * Play queued audio
   */
  private playNextAudio() {
    if (this.audioQueue.length === 0 || !this.currentAudioContext) return;

    const buffer = this.audioQueue.shift()!;
    const source = this.currentAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.currentAudioContext.destination);
    source.start();
  }

  /**
   * THE INTERRUPT TRICK: Play instant filler + queue AI response
   */
  async triggerInterrupt(
    trigger: InterruptTrigger,
    context: PitchContext
  ): Promise<void> {
    // Step 1: Instant local audio (0ms latency)
    const fillerType = this.selectFiller(trigger);
    const filler = this.interruptCache.get(fillerType);
    
    if (filler) {
      console.log('⚡ Playing instant interrupt:', fillerType);
      filler.currentTime = 0;
      filler.play();
    }

    // Step 2: Send context to AI for specific roast generation
    const prompt = this.buildInterruptPrompt(trigger, context);
    
    this.ws?.send(JSON.stringify({
      type: 'interrupt',
      prompt,
      context: {
        slide: context.currentSlide,
        emotion: context.faceEmotion,
        emotionConfidence: context.emotionConfidence,
        trigger: trigger.type,
      },
    }));

    // Step 3: AI response will stream back and play after filler
  }

  /**
   * Select appropriate filler based on trigger type
   */
  private selectFiller(trigger: InterruptTrigger): string {
    switch (trigger.type) {
      case 'keyword':
        return 'buzzword';
      case 'speed':
        return 'speed';
      case 'contradiction':
        return 'contradiction';
      case 'emotion':
        return 'emotion';
      default:
        return 'weak';
    }
  }

  /**
   * Build prompt for AI with interrupt context
   */
  private buildInterruptPrompt(trigger: InterruptTrigger, context: PitchContext): string {
    const basePrompt = `You are the Pitch Deck Exorcist. You just interrupted the presenter.`;
    
    let specificPrompt = '';
    
    switch (trigger.type) {
      case 'keyword':
        specificPrompt = `They just said "${trigger.value}" - a classic buzzword. Roast them for using meaningless jargon.`;
        break;
      case 'speed':
        specificPrompt = `They're speaking at ${trigger.value} words per minute - way too fast. They sound nervous. Call them out.`;
        break;
      case 'contradiction':
        specificPrompt = `They just contradicted their slide deck. ${trigger.value}. Destroy them.`;
        break;
      case 'emotion':
        specificPrompt = `Their face shows "${context.faceEmotion}" emotion. ${trigger.value}. Comment on their body language.`;
        break;
    }

    return `${basePrompt}\n\n${specificPrompt}\n\nCurrent slide: ${context.currentSlide || 'Unknown'}\nRecent transcript: ${context.transcript || 'N/A'}\n\nBe brutal but constructive. 2-3 sentences max.`;
  }

  /**
   * Send pitch deck content for context
   */
  setPitchDeck(content: string) {
    this.ws?.send(JSON.stringify({
      type: 'context',
      deckContent: content,
    }));
  }

  /**
   * Disconnect from Hathora
   */
  disconnect() {
    this.ws?.close();
    this.isConnected = false;
    this.currentAudioContext?.close();
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
