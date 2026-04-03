import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { generateWords } from '../utils/words';

export type MultiplayerState = 'lobby' | 'finding_match' | 'waiting' | 'starting' | 'typing' | 'finished';

export interface OpponentData {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  isReady: boolean;
  hasFinished: boolean;
  accuracy: number;
}

interface LocalStats {
  wpm: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  testTime: number;
}

export const useMultiplayerEngine = (userProfile: { id: string; name: string } | null) => {
  const [state, setState] = useState<MultiplayerState>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const [targetText, setTargetText] = useState<string>('');
  const [typedChars, setTypedChars] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  
  const [opponent, setOpponent] = useState<OpponentData | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const [localStats, setLocalStats] = useState<LocalStats | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  
  const winnerIdRef = useRef(winnerId);
  const targetTextRef = useRef(targetText);
  const isReadyRef = useRef(isReady);
  const opponentRef = useRef(opponent);

  // Sync refs
  useEffect(() => { winnerIdRef.current = winnerId; }, [winnerId]);
  useEffect(() => { targetTextRef.current = targetText; }, [targetText]);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);

  const localId = useMemo(() => userProfile?.id || 'guest-' + Math.random().toString(36).substr(2, 9), [userProfile?.id]);
  const localName = useMemo(() => userProfile?.name || 'Guest' + Math.floor(Math.random() * 1000), [userProfile?.name]);

  // Typing engine internals
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errors, setErrors] = useState<number>(0);
  const hasFinished = useRef(false);

  // Clean up
  const leaveRoom = useCallback(async () => {
    if (channel) {
      await channel.unsubscribe();
    }
    setChannel(null);
    setRoomId(null);
    setState('lobby');
    setTargetText('');
    setTypedChars('');
    setOpponent(null);
    setIsReady(false);
    setLocalStats(null);
    setWinnerId(null);
    hasFinished.current = false;
    setErrors(0);
    setStartTime(null);
  }, [channel]);

  // Handle global matchmaking
  const findMatch = useCallback(async () => {
    setState('finding_match');
    
    const mmChannel = supabase.channel('global_matchmaking');
    
    mmChannel.on('broadcast', { event: 'match_found' }, (payload) => {
      if (payload.payload.targetId === localId) {
         mmChannel.unsubscribe();
         joinRoom(payload.payload.roomId);
      }
    });

    mmChannel.on('broadcast', { event: 'looking_for_match' }, (payload) => {
      if (payload.payload.id !== localId) {
         const newRoom = 'room-' + Math.random().toString(36).substr(2, 9);
         mmChannel.send({
            type: 'broadcast',
            event: 'match_found',
            payload: { targetId: payload.payload.id, roomId: newRoom }
         });
         mmChannel.unsubscribe();
         joinRoom(newRoom);
      }
    });

    await mmChannel.subscribe(async (status) => {
       if (status === 'SUBSCRIBED') {
          mmChannel.send({
             type: 'broadcast',
             event: 'looking_for_match',
             payload: { id: localId }
          });
       }
    });
  }, [localId]);

  const joinRoom = useCallback(async (code: string) => {
    if (channel) await leaveRoom();
    
    setRoomId(code);
    setState('waiting');
    
    const newChannel = supabase.channel(`multiplayer_${code}`, {
       config: { presence: { key: localId } }
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
         const state = newChannel.presenceState();
         let opp: any = null;
         let weAreReady = false;
         let hostId = localId;

         for (const [, presences] of Object.entries(state)) {
            if (presences.length > 0) {
               const p = presences[0] as any;
               // simple way to determine host: lowest ID string
               if (p.id < hostId) hostId = p.id;
               
               if (p.id !== localId) {
                  opp = p;
               } else {
                  weAreReady = p.isReady;
               }
            }
         }

         if (opp) {
            setOpponent({
               id: opp.id,
               name: opp.name,
               progress: opp.progress || 0,
               wpm: opp.wpm || 0,
               isReady: opp.isReady || false,
               hasFinished: opp.hasFinished || false,
               accuracy: opp.accuracy || 0,
            });
         } else {
            setOpponent(null);
         }

          // Read latest from refs
         const currentTargetText = targetTextRef.current;
         
         // Host checks if both ready
         if (hostId === localId && opp && opp.isReady && weAreReady && !hasFinished.current && currentTargetText === '') {
             const words = generateWords(25);
             newChannel.send({
                type: 'broadcast',
                event: 'start_race',
                payload: { text: words }
             });
         }
      })
      .on('broadcast', { event: 'start_race' }, (payload) => {
         setTargetText(payload.payload.text);
         setState('starting');
         setCountdown(3);
      })
      .on('broadcast', { event: 'player_finished' }, (payload) => {
          if (winnerIdRef.current === null) {
              setWinnerId(payload.payload.id);
          }
      });

    await newChannel.subscribe(async (status) => {
       if (status === 'SUBSCRIBED') {
          await newChannel.track({
             id: localId,
             name: localName,
             progress: 0,
             wpm: 0,
             isReady: false,
             hasFinished: false,
             accuracy: 0
          });
       }
    });

    setChannel(newChannel);
  }, [channel, leaveRoom, localId, localName, targetText, winnerId]);

  // Countdown logic
  useEffect(() => {
     let timer: ReturnType<typeof setInterval>;
     if (state === 'starting' && countdown > 0) {
        timer = setInterval(() => {
           setCountdown(c => c - 1);
        }, 1000);
     } else if (state === 'starting' && countdown === 0) {
        setState('typing');
        setStartTime(Date.now());
     }
     return () => clearInterval(timer);
  }, [state, countdown]);

  // Update presence function
  const updatePresence = useCallback((progress: number, wpm: number, hasFin: boolean, acc: number) => {
     if (channel) {
        channel.track({
           id: localId,
           name: localName,
           isReady,
           progress,
           wpm: Math.round(wpm),
           hasFinished: hasFin,
           accuracy: Math.round(acc)
        });
     }
  }, [channel, localId, localName, isReady]);

  // Toggle ready
  const toggleReady = useCallback(() => {
     setIsReady(prev => {
        const next = !prev;
        if (channel) {
           channel.track({
              id: localId,
              name: localName,
              progress: 0,
              wpm: 0,
              isReady: next,
              hasFinished: false,
              accuracy: 0
           });
        }
        return next;
     });
  }, [channel, localId, localName]);

  // Typing mechanics
  const insertChar = useCallback((char: string) => {
    if (state !== 'typing') return;
    
    setTypedChars((prev) => {
      if (prev.length >= targetText.length) return prev;
      const nextTyped = prev + char;
      if (char !== targetText[prev.length]) setErrors((e) => e + 1);
      
      const progress = (nextTyped.length / targetText.length) * 100;
      updatePresence(progress, 0, false, 0); // wpm calculated on end for now, or could estimate
      
      return nextTyped;
    });
  }, [state, targetText, updatePresence]);

  const deleteChar = useCallback(() => {
    if (state !== 'typing') return;
    setTypedChars((prev) => {
      const nextTyped = prev.slice(0, -1);
      const progress = (nextTyped.length / targetText.length) * 100;
      updatePresence(progress, 0, false, 0);
      return nextTyped;
    });
  }, [state, targetText, updatePresence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state !== 'typing') return;
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

  // Finish logic
  useEffect(() => {
    if (state === 'typing' && !hasFinished.current && typedChars.length >= targetText.length && targetText.length > 0) {
       hasFinished.current = true;
       const endTime = Date.now();
       const testTimeElapsed = (endTime - (startTime || 0)) / 1000;
       const correctChars = typedChars.length - errors;
       const wpm = (correctChars / 5) / (testTimeElapsed / 60);
       const accuracy = Math.max(0, Math.min(100, (correctChars / Math.max(1, typedChars.length)) * 100));

       setLocalStats({
          wpm,
          accuracy,
          correct: correctChars,
          incorrect: errors,
          testTime: testTimeElapsed
       });

       updatePresence(100, wpm, true, accuracy);
       setState('finished');

       if (channel) {
          channel.send({
             type: 'broadcast',
             event: 'player_finished',
             payload: { id: localId }
          });
          if (winnerId === null) {
              setWinnerId(localId); // we are the first to finish
          }
       }
    }
  }, [typedChars, targetText, state, startTime, errors, channel, localId, winnerId, updatePresence]);

  // When opponent finishes and we are in typing state
  useEffect(() => {
     if (opponent?.hasFinished && !hasFinished.current && winnerId === null) {
         setWinnerId(opponent.id); 
     }
  }, [opponent, winnerId]);


  const rematch = useCallback(() => {
     setIsReady(false);
     setTargetText('');
     setTypedChars('');
     setState('waiting');
     setLocalStats(null);
     setWinnerId(null);
     hasFinished.current = false;
     setStartTime(null);
     setErrors(0);
     if (channel) {
        channel.track({
           id: localId,
           name: localName,
           progress: 0,
           wpm: 0,
           isReady: false,
           hasFinished: false,
           accuracy: 0
        });
     }
  }, [channel, localId, localName]);

  return {
    state,
    roomId,
    targetText,
    typedChars,
    countdown,
    opponent,
    isReady,
    localStats,
    winnerId,
    localId,
    localName,
    findMatch,
    joinRoom,
    leaveRoom,
    toggleReady,
    rematch
  };
};
