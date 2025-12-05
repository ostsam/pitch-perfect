"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface MicrophoneConfig {
  onTranscript?: (text: string) => void;
  onAudioData?: (data: ArrayBuffer) => void;
}

export function useMicrophone(config?: MicrophoneConfig) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Store latest callback in ref so it's always up-to-date
  const onTranscriptRef = useRef(config?.onTranscript);
  useEffect(() => {
    onTranscriptRef.current = config?.onTranscript;
  }, [config?.onTranscript]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Standard for STT
        }
      });
      
      streamRef.current = stream;

      // Try using browser's Web Speech API for real-time transcription
      if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart + ' ';
            } else {
              interimTranscript += transcriptPart;
            }
          }

          if (finalTranscript) {
            console.log('🎤 Final transcript:', finalTranscript);
            setTranscript(prev => prev + finalTranscript);
            const trimmedTranscript = finalTranscript.trim();
            console.log('📤 Sending to onTranscript callback:', trimmedTranscript);
            onTranscriptRef.current?.(trimmedTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied');
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        console.log('🎙️ Microphone started with Web Speech API');
        setIsRecording(true);
        return;
      }

      // Fallback: local recording without STT
      if (!recognitionRef.current) {
        // Fallback: local recording without STT
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            console.log('📊 Audio chunk:', event.data.size, 'bytes');
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          console.log('🎤 Recording complete:', audioBlob.size, 'bytes');
          
          const mockTranscript = "This is a simulated transcript. Add HATHORA_API_KEY for real STT.";
          setTranscript(mockTranscript);
          config?.onTranscript?.(mockTranscript);
        };

        mediaRecorder.start(1000);
        console.log('🎙️ Microphone started (local mode - no STT)');
      }
      
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Failed to access microphone. Please check permissions.');
      setIsRecording(false);
    }
  }, [config]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    console.log('🛑 Microphone stopped');
    setIsRecording(false);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    error,
  };
}
