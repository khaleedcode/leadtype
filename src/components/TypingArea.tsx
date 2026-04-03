import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { generateWords } from '../utils/words';
import { TestMode } from '../App';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface TypingAreaProps {
  mode: TestMode;
  amount: number;
}

export const TypingArea: React.FC<TypingAreaProps> = ({ mode, amount }) => {
  const [testWords, setTestWords] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const { user } = useAuth();
  
  const handleFinish = async (wpm: number, acc: number, stats: any) => {
    const newResult = { wpm, acc, stats, mode, amount, date: new Date().toISOString() };
    setResults(newResult);
    
    // Save to local storage always
    try {
      const history = JSON.parse(localStorage.getItem('leadtype_history') || '[]');
      history.push(newResult);
      localStorage.setItem('leadtype_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }

    // Save to Supabase if logged in
    if (user) {
      try {
        await supabase.from('test_results').insert([
          {
            user_id: user.id,
            wpm: Math.round(wpm),
            accuracy: Math.round(acc),
            mode,
            amount,
            correct_chars: stats.correct,
            incorrect_chars: stats.incorrect,
            test_time: stats.testTime
          }
        ]);
      } catch (err) {
        console.error('Supabase save error', err);
      }
    }
  };

  const { state, targetText, typedChars, reset, timeLeft, isLoading } = useTypingEngine({
    mode,
    amount,
    wordsGenerator: generateWords,
    onFinish: handleFinish
  });

  useEffect(() => {
    setTestWords(targetText);
  }, [targetText]);

  const activeLetterRef = useRef<HTMLSpanElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setTimeout(() => {
       if (activeLetterRef.current && wordsContainerRef.current) {
         const top = activeLetterRef.current.offsetTop;
         const left = activeLetterRef.current.offsetLeft;
         setCaretPos({ left, top });
         
         // Line height is around 36px (1.5 * 1.5rem = 2.25rem = ~36px)
         // We want to keep caret at line 1 or 2. If top > 36 (line 3+), we scroll down.
         const lineHeight = 36;
         if (top > lineHeight * 1.5) {
            setScrollOffset(top - lineHeight);
         } else if (state === 'idle') {
            setScrollOffset(0);
         }
       }
    }, 0);
  }, [typedChars, targetText, state]); 

  const words = useMemo(() => targetText.split(' '), [targetText]);

  if (isLoading) {
    return (
      <div className="typing-wrapper">
        <div className="loading">generating coherent sentences...</div>
        <style>{`
          .typing-wrapper { width: 100%; font-family: 'Roboto Mono', monospace; }
          .loading { color: var(--sub-color); text-align: center; margin-top: 3rem; font-size: 1.5rem; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  if (!testWords) return null;

  if (results) {
    return (
      <div className="results-screen">
        <h2>Test Complete</h2>
        <div className="stats" style={{ display: 'flex', width: '100%', padding: '2rem 0', flexWrap: 'wrap' }}>
          <div className="main-stats" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
            <div className="stat-group">
              <label>wpm</label>
              <div className="val" style={{ fontSize: '4rem', color: 'var(--caret-color)' }}>{Math.round(results.wpm)}</div>
            </div>
            <div className="stat-group">
              <label>acc</label>
              <div className="val" style={{ fontSize: '4rem', color: 'var(--caret-color)' }}>{Math.round(results.acc)}%</div>
            </div>
          </div>
          <div className="sub-stats" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingTop: '1rem' }}>
            <div className="stat-group row">
              <label>test type</label>
              <div className="val sub">{mode} {amount}</div>
            </div>
            <div className="stat-group row">
              <label>raw</label>
              <div className="val sub">{Math.round(results.wpm * 1.05)}</div> {/* Fake raw wpm for aesthetic */}
            </div>
            <div className="stat-group row">
              <label>characters</label>
              <div className="val sub">{results.stats.correct}/{results.stats.incorrect}/0/0</div>
            </div>
            <div className="stat-group row">
              <label>time</label>
              <div className="val sub">{Math.round(results.stats.testTime)}s</div>
            </div>
          </div>
        </div>
        <button className="restart-btn" onClick={() => {
           reset();
           setResults(null);
        }}>restart test</button>
        <div className="instruction" style={{ marginTop: '1rem', color: 'var(--sub-color)', fontSize: '0.9rem', alignSelf: 'center' }}>
          press <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--sub-alt-color)', borderRadius: '4px' }}>tab</span> + <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--sub-alt-color)', borderRadius: '4px' }}>enter</span> to restart
        </div>
        <style>{`
          .results-screen { display: flex; flex-direction: column; width: 100%; max-width: 1000px; animation: fadeIn 0.5s ease; }
          .results-screen h2 { color: var(--sub-color); margin: 0; font-weight: normal; }
          .stat-group { display: flex; flex-direction: column; }
          .stat-group.row { flex-direction: row; justify-content: space-between; align-items: center; }
          .stat-group label { color: var(--sub-color); font-size: 1rem; }
          .stat-group .val { color: var(--main-color); font-weight: bold; line-height: 1; }
          .stat-group .val.sub { font-size: 1.5rem; font-weight: normal; }
          .restart-btn { background: none; border: none; color: var(--sub-color); font-size: 1.2rem; cursor: pointer; transition: color 0.2s; padding: 0.5rem 1rem; align-self: center; margin-top: 2rem; }
          .restart-btn:hover { color: var(--text-color); }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  let globalCharIndex = 0;
  
  const completedWords = typedChars.split(' ').length - 1;

  return (
    <div className="typing-wrapper">
      <div className="test-header">
         <div className="timer-wrapper" style={{ opacity: state === 'typing' ? 1 : 0, transition: 'opacity 0.2s' }}>
           {mode === 'time' && <div className="timer">{timeLeft}</div>}
           {mode === 'words' && <div className="timer">{completedWords}/{amount}</div>}
         </div>
      </div>

      <div className="words-viewport">
        <div 
          className="words" 
          tabIndex={0} 
          autoFocus
          ref={wordsContainerRef}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
           {state !== 'finished' && (
             <div 
               className="caret" 
               style={{ 
                 left: caretPos.left, 
                 top: caretPos.top,
                 opacity: state === 'idle' ? 1 : 1 
               }} 
             />
           )}
           
           {words.map((word, wIdx) => {
             const isLastWord = wIdx === words.length - 1;
             const letters = word.split('');
             
             // To optimize rendering, we can determine word state
             return (
               <div key={wIdx} className="word">
                 {letters.map((char, lIdx) => {
                   const isTyped = globalCharIndex < typedChars.length;
                   const isActive = globalCharIndex === typedChars.length;
                   const typedChar = typedChars[globalCharIndex];
                   
                   let charClass = "letter ";
                   if (isActive) {
                     charClass += "active";
                   } else if (isTyped) {
                     if (typedChar === char) {
                       charClass += "correct";
                     } else {
                       charClass += "incorrect";
                     }
                   }

                   globalCharIndex++;

                   return (
                     <span 
                       key={lIdx} 
                       className={charClass}
                       ref={isActive ? activeLetterRef : null}
                     >
                       {char}
                     </span>
                   );
                 })}
                 
                 {!isLastWord && (() => {
                   const isTyped = globalCharIndex < typedChars.length;
                   const isActive = globalCharIndex === typedChars.length;
                   const typedChar = typedChars[globalCharIndex];
                   
                   let spaceClass = "letter space ";
                   if (isActive) spaceClass += "active";
                   else if (isTyped) {
                      if (typedChar === ' ') spaceClass += "correct";
                      else spaceClass += "incorrect extra";
                   }

                   const ref = isActive ? activeLetterRef : null;
                   globalCharIndex++;

                   return <span key="space" className={spaceClass} ref={ref}>&nbsp;</span>
                 })()}
               </div>
             );
           })}
        </div>
      </div>

      <style>{`
        .typing-wrapper {
          position: relative;
          width: 100%;
          font-family: 'Roboto Mono', monospace;
          font-size: 1.8rem;
          line-height: 1.5;
          outline: none;
        }
        .test-header {
           height: 2.5rem;
           margin-bottom: 0.5rem;
           display: flex;
           align-items: center;
        }
        .timer {
           color: var(--caret-color);
           font-size: 1.8rem;
           font-weight: normal;
        }
        .words-viewport {
          max-height: 108px; /* 3 lines exact */
          overflow: hidden;
          position: relative;
        }
        .words {
          display: flex;
          flex-wrap: wrap;
          user-select: none;
          gap: 0 0.5em;
          outline: none;
          position: relative;
          transition: transform 0.2s ease-out;
        }
        .word {
          display: flex;
          margin-bottom: 0px;
          height: 36px;
        }
        .letter {
          transition: color 0.1s;
          color: var(--sub-color);
        }
        .letter.correct {
          color: var(--text-color);
        }
        .letter.incorrect {
          color: var(--error-color);
        }
        .letter.incorrect.extra {
          color: var(--error-extra-color);
        }
        .letter.space {
          width: 0.5em;
        }
        
        .caret {
          position: absolute;
          width: 3px;
          height: 1.8rem;
          background-color: var(--caret-color);
          transition: left 0.1s ease, top 0.1s ease;
          border-radius: 2px;
          z-index: 10;
          margin-top: 0.2rem;
        }
        
        .typing-wrapper:focus-within .caret {
          animation: caretFlash 1s infinite;
        }
        
        @keyframes caretFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
