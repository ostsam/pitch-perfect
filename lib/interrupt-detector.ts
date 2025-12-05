/**
 * Live Interrupt Detection Algorithm
 * Analyzes real-time transcript, emotion, and context to trigger interrupts
 */

import type { FaceData } from '@/hooks/use-face-detection';
import type { InterruptTrigger, PitchContext } from './hathora-client';

export interface InterruptRule {
  enabled: boolean;
  threshold: number;
}

export interface InterruptConfig {
  buzzwords: InterruptRule;
  speed: InterruptRule;
  contradiction: InterruptRule;
  emotion: InterruptRule;
}

const DEFAULT_CONFIG: InterruptConfig = {
  buzzwords: { enabled: true, threshold: 0.8 },
  speed: { enabled: true, threshold: 160 }, // WPM
  contradiction: { enabled: true, threshold: 0.7 },
  emotion: { enabled: true, threshold: 0.6 },
};

/**
 * Buzzwords that trigger immediate interrupts
 * Customized for ReStock AI pitch deck
 */
const BUZZWORDS = [
  // Generic buzzwords (always bad)
  'synergy', 'disruptive', 'game-changing', 'revolutionary',
  'paradigm shift', 'leverage', 'circle back', 'touch base',
  'low-hanging fruit', 'move the needle', 'unicorn', 'moonshot',
  
  // ReStock AI specific triggers
  'autopilot', 'os for retail', // Used in closing - should be confident
  'hassle-free', // Used in tagline - vague claim
  'autonomous', // Used multiple times - buzzword overuse
  'real-time', // Used 4+ times - repetitive
  'optimize', 'automate', 'improve', // Action verbs - overused
  'ai-powered', 'computer vision', 'llm-powered', // Tech jargon without depth
];

/**
 * Contradiction patterns to detect
 * Customized for ReStock AI pitch deck
 */
const CONTRADICTION_PATTERNS = [
  // Market claims vs reality
  { slide: 'tam', speech: ['small market', 'niche', 'limited', 'few customers'] },
  { slide: '$42b', speech: ['hard to scale', 'difficult market', 'slow adoption'] },
  
  // Team claims vs uncertainty
  { slide: 'expertise from experts', speech: ['still learning', 'figuring out', 'not sure', 'trying to understand'] },
  { slide: 'ceo', speech: ['first time', 'never done this', 'new to'] },
  
  // Revenue claims vs burn rate
  { slide: 'break-even at 18 months', speech: ['need more funding', 'burn rate high', 'running out'] },
  { slide: '$120m arr', speech: ['hard to acquire customers', 'slow sales', 'no traction'] },
  { slide: 'profitable', speech: ['losing money', 'negative margin', 'high costs'] },
  
  // Product claims vs reality
  { slide: 'no hardware replacement', speech: ['need to install', 'hardware required', 'buy equipment'] },
  { slide: 'autonomous', speech: ['manual', 'human in loop', 'requires supervision'] },
  { slide: 'real-time', speech: ['delay', 'batch processing', 'takes time'] },
  
  // Competition
  { slide: 'no competitors', speech: ['amazon', 'walmart', 'target', 'kroger', 'shelf engine', 'focal systems'] },
];

export class InterruptDetector {
  private config: InterruptConfig;
  private transcriptBuffer: string[] = [];
  private wordsPerMinute = 0;
  private lastWordTime = Date.now();
  private wordCount = 0;
  private slideContext: Map<number, string> = new Map();

  constructor(config: Partial<InterruptConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load pitch deck context for contradiction detection
   */
  loadPitchDeck(slideNumber: number, content: string) {
    this.slideContext.set(slideNumber, content.toLowerCase());
  }

  /**
   * Analyze incoming transcript chunk for interrupt triggers
   */
  analyze(
    transcript: string,
    faceData: FaceData | null,
    currentSlide: number
  ): InterruptTrigger | null {
    this.updateTranscriptBuffer(transcript);
    this.updateSpeechSpeed(transcript);

    // Check all interrupt conditions in priority order
    
    // 1. Buzzword detection (highest priority)
    const buzzwordTrigger = this.detectBuzzwords(transcript);
    if (buzzwordTrigger) return buzzwordTrigger;

    // 2. Speed detection
    const speedTrigger = this.detectSpeed();
    if (speedTrigger) return speedTrigger;

    // 3. Contradiction detection
    const contradictionTrigger = this.detectContradiction(transcript, currentSlide);
    if (contradictionTrigger) return contradictionTrigger;

    // 4. Emotion-based detection
    const emotionTrigger = this.detectEmotionIssue(faceData, transcript);
    if (emotionTrigger) return emotionTrigger;

    return null;
  }

  /**
   * Detect buzzwords in transcript
   */
  private detectBuzzwords(transcript: string): InterruptTrigger | null {
    if (!this.config.buzzwords.enabled) return null;

    const lowerTranscript = transcript.toLowerCase();
    const foundBuzzword = BUZZWORDS.find(word => lowerTranscript.includes(word));

    if (foundBuzzword) {
      return {
        type: 'keyword',
        value: foundBuzzword,
        confidence: 1.0,
      };
    }

    return null;
  }

  /**
   * Detect if speaking too fast
   */
  private detectSpeed(): InterruptTrigger | null {
    if (!this.config.speed.enabled) return null;

    if (this.wordsPerMinute > this.config.speed.threshold) {
      return {
        type: 'speed',
        value: this.wordsPerMinute,
        confidence: Math.min((this.wordsPerMinute - this.config.speed.threshold) / 40, 1.0),
      };
    }

    return null;
  }

  /**
   * Detect contradictions between slides and speech
   */
  private detectContradiction(transcript: string, currentSlide: number): InterruptTrigger | null {
    if (!this.config.contradiction.enabled) return null;

    const slideContent = this.slideContext.get(currentSlide);
    if (!slideContent) return null;

    const lowerTranscript = transcript.toLowerCase();

    // Check contradiction patterns
    for (const pattern of CONTRADICTION_PATTERNS) {
      if (slideContent.includes(pattern.slide)) {
        const contradictingWord = pattern.speech.find(word => lowerTranscript.includes(word));
        
        if (contradictingWord) {
          return {
            type: 'contradiction',
            value: `Slide says "${pattern.slide}" but you mentioned "${contradictingWord}"`,
            confidence: 0.9,
          };
        }
      }
    }

    return null;
  }

  /**
   * Detect emotion-related issues
   * Customized for ReStock AI pitch
   */
  private detectEmotionIssue(faceData: FaceData | null, transcript: string): InterruptTrigger | null {
    if (!this.config.emotion.enabled || !faceData) return null;

    // Detect nervousness during financials or ask
    const moneyTalk = ['million', 'revenue', 'equity', 'valuation', 'funding', 'ask', 'raising'];
    const isTalkingMoney = moneyTalk.some(keyword => transcript.toLowerCase().includes(keyword));
    
    if (isTalkingMoney && faceData.dominantEmotion === 'fearful' && faceData.confidence > this.config.emotion.threshold) {
      return {
        type: 'emotion',
        value: 'Nervous about the numbers? VCs notice that.',
        confidence: faceData.confidence,
      };
    }

    // Detect overconfidence during problem/solution
    const criticalTopics = ['problem', 'trillion', 'loss', 'retailers lose', 'out-of-stock'];
    const isCriticalTopic = criticalTopics.some(keyword => transcript.toLowerCase().includes(keyword));
    
    if (isCriticalTopic && faceData.dominantEmotion === 'happy' && faceData.confidence > 0.7) {
      return {
        type: 'emotion',
        value: 'Why smile? $1.1 trillion lost is serious.',
        confidence: faceData.confidence,
      };
    }

    // Detect defensiveness during market/competition
    const competitiveTalk = ['competitor', 'market', 'player', 'existing solution'];
    const isTalkingCompetition = competitiveTalk.some(keyword => transcript.toLowerCase().includes(keyword));
    
    if (isTalkingCompetition && faceData.dominantEmotion === 'angry' && faceData.confidence > this.config.emotion.threshold) {
      return {
        type: 'emotion',
        value: 'Defensive about competitors? Red flag.',
        confidence: faceData.confidence,
      };
    }

    // Generic nervousness
    if (faceData.dominantEmotion === 'fearful' && faceData.confidence > this.config.emotion.threshold) {
      return {
        type: 'emotion',
        value: 'You look terrified. VCs can smell fear.',
        confidence: faceData.confidence,
      };
    }

    return null;
  }

  /**
   * Update transcript buffer for context
   */
  private updateTranscriptBuffer(transcript: string) {
    this.transcriptBuffer.push(transcript);
    
    // Keep last 10 chunks
    if (this.transcriptBuffer.length > 10) {
      this.transcriptBuffer.shift();
    }
  }

  /**
   * Calculate words per minute
   */
  private updateSpeechSpeed(transcript: string) {
    const words = transcript.trim().split(/\s+/).length;
    this.wordCount += words;

    const now = Date.now();
    const elapsedMinutes = (now - this.lastWordTime) / 60000;

    if (elapsedMinutes > 0) {
      this.wordsPerMinute = words / elapsedMinutes;
    }

    this.lastWordTime = now;
  }

  /**
   * Get current context for AI
   */
  getContext(): PitchContext {
    return {
      transcript: this.transcriptBuffer.slice(-3).join(' '),
    };
  }

  /**
   * Reset detector state
   */
  reset() {
    this.transcriptBuffer = [];
    this.wordsPerMinute = 0;
    this.wordCount = 0;
    this.lastWordTime = Date.now();
  }
}
