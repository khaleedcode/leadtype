import { useState, useCallback, useEffect, useRef } from 'react';
import { TestMode } from '../App';
import { fetchGeneratedText } from '../utils/ai';

export type TypingState = 'idle' | 'typing' | 'finished';

interface UseTypingEngineProps {
  mode: TestMode;
  amount: number;
  wordsGenerator: (len: number) => string;
  onFinish?: (wpm: number, accuracy: number, rawStats: { correct: number, incorrect: number, extra: number, missed: number, testTime: number }) => void;
}

export const useTypingEngine = ({ mode, amount, wordsGenerator, onFinish }: UseTypingEngineProps) => {
  // Target text might grow in time mode
  const [targetText, setTargetText] = useState(() => mode === 'generated' ? '' : wordsGenerator(mode === 'words' ? amount : 50));
  const [typedChars, setTypedChars] = useState<string>('');
  const [state, setState] = useState<TypingState>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(mode === 'generated');
  
  // Stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errors, setErrors] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(mode === 'time' ? amount : 0);
  const hasFinished = useRef(false);

  const reset = useCallback(async () => {
    setState('idle');
    setStartTime(null);
    setErrors(0);
    hasFinished.current = false;
    
    if (mode === 'generated') {
      setIsLoading(true);
      setTargetText('');
      setTypedChars('');
      setTimeLeft(0);
      try {
        const text = await fetchGeneratedText(amount);
        setTargetText(text);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTargetText(wordsGenerator(mode === 'words' ? amount : 50));
      setTypedChars('');
      setTimeLeft(mode === 'time' ? amount : 0);
    }
  }, [mode, amount, wordsGenerator]);

  // Initial mount trigger for generated mode
  useEffect(() => {
    if (mode === 'generated') {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Tab + Enter for restart
  useEffect(() => {
    const handleResetKeys = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', handleResetKeys);
    return () => window.removeEventListener('keydown', handleResetKeys);
  }, [reset]);

  const insertChar = useCallback((char: string) => {
    setState((prev) => {
      if (prev === 'finished') return prev;
      if (prev === 'idle') {
        setStartTime(Date.now());
        return 'typing';
      }
      return prev;
    });

    setTypedChars((prev) => {
      const nextTyped = prev + char;
      if (char !== targetText[prev.length]) setErrors((e) => e + 1);
      return nextTyped;
    });
  }, [targetText]);

  const deleteChar = useCallback(() => {
    setTypedChars((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state === 'finished') return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
        if (e.key === 'Backspace') {
          deleteChar();
          e.preventDefault();
        }
        return;
      }
      insertChar(e.key);
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, insertChar, deleteChar]);

  // Extension of target text in time mode if user types too fast
  useEffect(() => {
    if (mode === 'time' && typedChars.length > targetText.length - 20) {
       setTargetText(prev => prev + " " + wordsGenerator(20));
    }
  }, [typedChars, targetText, mode, wordsGenerator]);

  // Timer logic for time mode
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === 'typing' && mode === 'time') {
      interval = setInterval(() => {
         setTimeLeft((prev) => {
            if (prev <= 1) {
               clearInterval(interval);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, mode]);

  // Completion logic
  useEffect(() => {
    let triggeredFinish = false;
    if (!hasFinished.current && state !== 'finished') {
       if (mode === 'words' && typedChars.length >= targetText.length && targetText.length > 0) {
          triggeredFinish = true;
       } else if (mode === 'time' && timeLeft === 0 && state === 'typing') {
          triggeredFinish = true;
       }
    }

    if (triggeredFinish) {
       hasFinished.current = true;
       setState('finished'); 
       
       if (onFinish && startTime) {
          const endTime = Date.now();
          const testTimeElapsed = mode === 'time' ? amount : (endTime - startTime) / 1000;
          
          const correctChars = typedChars.length - errors;
          const wpm = (correctChars / 5) / (testTimeElapsed / 60);
          const rawAccuracy = (correctChars / Math.max(1, typedChars.length)) * 100;
          const accuracy = Math.max(0, Math.min(100, rawAccuracy));
          
          // Call once
          onFinish(wpm, accuracy, {
            correct: correctChars,
            incorrect: errors,
            extra: 0,
            missed: 0,
            testTime: testTimeElapsed
          });
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedChars, targetText, state, startTime, errors, onFinish, mode, timeLeft, amount]);

  return {
    state,
    targetText,
    typedChars,
    reset,
    errors,
    timeLeft,
    isLoading
  };
};
