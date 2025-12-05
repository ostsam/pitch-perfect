/**
 * Deepgram Service Configuration
 * 
 * STT: Web Speech API (browser built-in)
 * TTS: Deepgram Aura TTS
 * LLM: OpenAI GPT-4
 */

export interface DeepgramConfig {
  deepgramApiKey: string;
  openaiApiKey: string;
}

/**
 * Deepgram Aura TTS Service
 * High-quality, low-latency text-to-speech
 */
export class DeepgramTTSService {
  private apiKey: string;

  constructor(config: DeepgramConfig) {
    this.apiKey = config.deepgramApiKey;
  }

  async synthesize(text: string, voice: string = 'aura-asteria-en'): Promise<ArrayBuffer> {
    console.log('🔊 Deepgram TTS Request:', { text, voice });
    
    const response = await fetch('https://api.deepgram.com/v1/speak?model=' + voice, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS error response:', errorText);
      throw new Error(`TTS failed: ${response.statusText} (${response.status})`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('🔊 TTS Audio received:', audioBuffer.byteLength, 'bytes');
    return audioBuffer;
  }
}

/**
 * OpenAI LLM Service
 * GPT-4 for generating roasts
 */
export class OpenAILLMService {
  private apiKey: string;
  private model: string;

  constructor(config: DeepgramConfig, model: string = 'gpt-4o-mini') {
    this.apiKey = config.openaiApiKey;
    this.model = model;
  }

  async generateRoast(context: {
    transcript: string;
    emotion?: string;
    slideNumber?: number;
    triggerType: string;
    slideContent?: string;
    spellingErrors?: string[];
  }): Promise<string> {
    const systemPrompt = `You are "The Pitch Exorcist" - a brutal AI that interrupts bad pitches with savage roasts. 
Keep responses VERY SHORT (1 sentence max, 10 words or less). Be funny but cutting.
You also fact-check slides and catch spelling errors. Point them out sarcastically.`;

    let slideInfo = '';
    if (context.slideContent) {
      slideInfo = `\n- Slide content: "${context.slideContent.substring(0, 200)}..."`;
    }
    if (context.spellingErrors && context.spellingErrors.length > 0) {
      slideInfo += `\n- SPELLING ERRORS FOUND: ${context.spellingErrors.join(', ')}`;
    }

    const userPrompt = `Interrupt this pitch:
- What they said: "${context.transcript}"
- Their emotion: ${context.emotion || 'unknown'}
- Current slide: ${context.slideNumber || 'unknown'}
- Trigger: ${context.triggerType}${slideInfo}

Roast them NOW (focus on spelling errors if found):`;

    console.log('🤖 OpenAI Request:', { model: this.model, triggerType: context.triggerType, hasSlideContent: !!context.slideContent, spellingErrors: context.spellingErrors?.length || 0 });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.9,
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LLM error response:', errorText);
        throw new Error(`LLM request failed: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log('🤖 OpenAI Response:', data);
      
      const roast = data.choices[0]?.message?.content || "Stop right there!";
      return roast;
    } catch (err) {
      console.error('Failed to generate roast:', err);
      throw err;
    }
  }
}
