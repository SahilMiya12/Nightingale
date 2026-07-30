import { useState, useCallback } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = ({ onTranscript, onError }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const errorMsg = 'Speech recognition not supported';
      setTranscript(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(text);
          setIsListening(false);
          recognition.stop();
          onTranscript(text);
          break;
        } else {
          setTranscript(text + '...');
        }
      }
    };

    recognition.onerror = (event: any) => {
      const errorMsg = `Error: ${event.error}`;
      setTranscript(errorMsg);
      setIsListening(false);
      if (onError) onError(errorMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      const errorMsg = 'Failed to start microphone';
      setTranscript(errorMsg);
      setIsListening(false);
      if (onError) onError(errorMsg);
    }
  }, [onTranscript, onError]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    setTranscript,
    setIsProcessing,
    startListening,
    stopListening
  };
};