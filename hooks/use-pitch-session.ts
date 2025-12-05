"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { OpenAILLMService } from '@/lib/deepgram-services';
import { InterruptDetector } from '@/lib/interrupt-detector';
import { PDFParser } from '@/lib/pdf-parser';
import type { FaceData } from './use-face-detection';

export interface PitchSessionConfig {
  openaiApiKey: string;
}

export function usePitchSession(config?: PitchSessionConfig) {
  const [llmService, setLlmService] = useState<OpenAILLMService | null>(null);
  const [detector] = useState(() => new InterruptDetector());
  const [pdfParser] = useState(() => new PDFParser());
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSlideRef = useRef(1);
  const lastTranscriptRef = useRef('');
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize OpenAI LLM and browser Speech Synthesis
  useEffect(() => {
    if (config?.openaiApiKey) {
      const llm = new OpenAILLMService({
        deepgramApiKey: '', // Not needed for OpenAI
        openaiApiKey: config.openaiApiKey,
      });
      setLlmService(llm);
    }
    
    // Initialize browser speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis;
      console.log('✅ Browser Speech Synthesis ready');
    }
  }, [config?.openaiApiKey]);

  // Play audio queue
  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const audio = audioQueueRef.current.shift()!;

    audio.onended = () => {
      isPlayingRef.current = false;
      playNextAudio();
    };

    audio.play().catch(err => {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
      playNextAudio();
    });
  }, []);

  // Play interrupt audio + generate AI roast
  const playInterrupt = useCallback(async (trigger: any, context: any) => {
    console.log('🔊 Playing interrupt for:', trigger.type);

    // Generate AI roast if services available
    if (llmService && speechSynthesisRef.current) {
      console.log('🤖 Generating AI roast with OpenAI...');
      try {
        // Get current slide content and spelling errors
        const slideNumber = context.currentSlide || 1;
        const slideText = pdfParser.getPageText(slideNumber);
        const spellingErrors = pdfParser.getSpellingErrors(slideNumber);
        
        // Generate roast from LLM with slide context
        const roast = await llmService.generateRoast({
          transcript: context.lastTranscript || '',
          emotion: context.faceEmotion,
          slideNumber: slideNumber,
          triggerType: trigger.type,
          slideContent: slideText,
          spellingErrors: spellingErrors,
        });

        console.log('💬 Generated roast:', roast);

        // Use browser Speech Synthesis (instant, free!)
        console.log('🔊 Speaking with browser Speech Synthesis...');
        const utterance = new SpeechSynthesisUtterance(roast);
        utterance.rate = 1.2; // Faster for snappy roasts
        utterance.pitch = 0.9; // Slightly lower pitch for authority
        utterance.volume = 1.0;
        
        // Get a good voice if available
        const voices = speechSynthesisRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Daniel')) || voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        speechSynthesisRef.current.speak(utterance);
        console.log('✅ Speech synthesis started');
      } catch (err) {
        console.error('Failed to generate AI roast:', err);
        console.error('Error details:', err instanceof Error ? err.message : err);
      }
    } else {
      console.log('⚠️ No LLM service - local mode only');
    }
  }, [llmService, pdfParser]);

  // Start session
  const startSession = useCallback(async (deckContent?: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (deckContent) {
        // Parse deck content into slides for contradiction detection
        const slides = deckContent.split(/\n(?=Slide \d+|Page \d+)/gi);
        slides.forEach((slideContent, index) => {
          detector.loadPitchDeck(index + 1, slideContent);
        });
      }
      
      setIsActive(true);
      console.log('✅ Pitch session started');
      
      if (!llmService) {
        setError('Running in local mode. Add OPENAI_API_KEY for AI roasts.');
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to start session. Check your configuration.');
      setIsActive(false); // Continue in local mode
    } finally {
      setIsConnecting(false);
    }
  }, [llmService, detector]);

  // Process incoming transcript + face data
  const processInput = useCallback((
    transcript: string,
    faceData: FaceData | null,
    currentSlide?: number
  ) => {
    console.log('📥 processInput called:', { transcript, isActive, faceData: !!faceData, currentSlide });
    
    if (!isActive) {
      console.log('⚠️ Session not active, skipping');
      return;
    }
    
    if (!transcript) {
      console.log('⚠️ No transcript provided, skipping');
      return;
    }

    // Update current slide
    if (currentSlide !== undefined) {
      currentSlideRef.current = currentSlide;
    }

    // Only process new transcript chunks
    if (transcript === lastTranscriptRef.current) {
      console.log('⚠️ Duplicate transcript, skipping');
      return;
    }
    lastTranscriptRef.current = transcript;

    console.log('🎤 Processing:', transcript);

    // Analyze for interrupt triggers
    const trigger = detector.analyze(
      transcript,
      faceData,
      currentSlideRef.current
    );

    if (trigger) {
      console.log('⚡ Interrupt triggered:', trigger);

      // Build context
      const context = {
        ...detector.getContext(),
        currentSlide: currentSlideRef.current,
        faceEmotion: faceData?.dominantEmotion,
        emotionConfidence: faceData?.confidence,
        lastTranscript: transcript,
      };

      // Trigger interrupt with AI or local fallback
      playInterrupt(trigger, context);
    } else {
      console.log('✅ No interrupt triggered for:', transcript);
    }
  }, [isActive, detector, playInterrupt]);

  // Update current slide number
  const setCurrentSlide = useCallback((slideNumber: number) => {
    currentSlideRef.current = slideNumber;
  }, []);

  // Stop session
  const stopSession = useCallback(() => {
    detector.reset();
    setIsActive(false);
    lastTranscriptRef.current = '';
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    console.log('🛑 Pitch session stopped');
  }, [detector]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };
  }, []);

  return {
    startSession,
    stopSession,
    processInput,
    setCurrentSlide,
    isActive,
    isConnecting,
    isConnected: !!(llmService && speechSynthesisRef.current),
    error,
  };
}
