import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMultiplayerEngine } from '../hooks/useMultiplayerEngine';
import { useAuth } from '../context/AuthContext';

interface MultiplayerAreaProps {
  onBack: () => void;
}

export const MultiplayerArea: React.FC<MultiplayerAreaProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [showOpponentStats, setShowOpponentStats] = useState(false);

  const {
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
  } = useMultiplayerEngine(user ? { id: user.id, name: user.user_metadata?.username || 'Player' } : null);

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
         const lineHeight = 36;
         if (top > lineHeight * 1.5) {
            setScrollOffset(top - lineHeight);
         } else if (state === 'waiting' || state === 'starting') {
            setScrollOffset(0);
         }
       }
    }, 0);
  }, [typedChars, targetText, state]);

  const words = useMemo(() => targetText.split(' '), [targetText]);

  const renderLobby = () => (
    <div className="multiplayer-lobby animation-fade">
      <h2>1v1 Race</h2>
      <div className="lobby-actions">
        <button className="primary-btn" onClick={findMatch}>Find Match (Global)</button>
        <div className="divider-text">OR</div>
        <div className="room-actions">
          <button onClick={() => {
             const code = Math.random().toString(36).substr(2, 6).toUpperCase();
             joinRoom(code);
          }}>Create Room</button>
          <div className="join-group">
            <input 
              type="text" 
              placeholder="Room Code" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
            />
            <button onClick={() => joinCode && joinRoom(joinCode)}>Join</button>
          </div>
        </div>
      </div>
      <button className="back-btn" onClick={onBack}>← Back to Solo</button>
      <style>{`
        .multiplayer-lobby { display: flex; flex-direction: column; align-items: center; gap: 2rem; margin-top: 2rem; }
        .multiplayer-lobby h2 { color: var(--main-color); font-size: 2.5rem; margin: 0; }
        .lobby-actions { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; max-width: 400px; }
        .primary-btn { padding: 1rem; font-size: 1.2rem; background: var(--main-color); color: var(--bg-color); border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: opacity 0.2s; }
        .primary-btn:hover { opacity: 0.9; }
        .divider-text { color: var(--sub-color); text-align: center; }
        .room-actions { display: flex; flex-direction: column; gap: 1rem; background: var(--sub-alt-color); padding: 1.5rem; border-radius: 8px; }
        .room-actions button { padding: 0.8rem; background: var(--bg-color); border: 1px solid var(--sub-color); color: var(--text-color); border-radius: 4px; cursor: pointer; }
        .room-actions button:hover { border-color: var(--main-color); }
        .join-group { display: flex; gap: 0.5rem; }
        .join-group input { flex: 1; padding: 0.8rem; background: var(--bg-color); border: 1px solid var(--sub-color); color: var(--text-color); border-radius: 4px; font-family: monospace; text-transform: uppercase; }
        .back-btn { margin-top: 2rem; background: transparent; border: none; color: var(--sub-color); cursor: pointer; }
        .back-btn:hover { color: var(--text-color); }
        .animation-fade { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );

  const renderFindingMatch = () => (
    <div className="finding-match animation-fade">
      <div className="spinner"></div>
      <h3>Searching for an opponent...</h3>
      <button className="back-btn" onClick={leaveRoom}>Cancel</button>
      <style>{`
        .finding-match { display: flex; flex-direction: column; align-items: center; gap: 2rem; margin-top: 4rem; }
        .finding-match h3 { color: var(--sub-color); font-weight: normal; }
        .spinner { width: 40px; height: 40px; border: 4px solid var(--sub-alt-color); border-top-color: var(--main-color); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const renderWaiting = () => (
    <div className="waiting-room animation-fade">
      <div className="room-header">
        <span>Room Code: <strong className="room-code">{roomId}</strong></span>
        <button className="leave-btn" onClick={leaveRoom}>Leave</button>
      </div>
      
      <div className="players-container">
        <div className="player-card local-player">
          <div className="player-name">{localName} (You)</div>
          <div className={`status ${isReady ? 'ready' : 'not-ready'}`}>
            {isReady ? 'READY' : 'NOT READY'}
          </div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="player-card opponent-player">
          {opponent ? (
            <>
              <div className="player-name">{opponent.name}</div>
              <div className={`status ${opponent.isReady ? 'ready' : 'not-ready'}`}>
                {opponent.isReady ? 'READY' : 'NOT READY'}
              </div>
            </>
          ) : (
            <div className="waiting-text">Waiting for opponent...</div>
          )}
        </div>
      </div>

      {opponent ? (
        <button 
          className={`ready-btn ${isReady ? 'is-ready' : ''}`} 
          onClick={toggleReady}
        >
          {isReady ? 'Cancel Ready' : 'Ready Up'}
        </button>
      ) : (
         <div className="waiting-instruction">Share the code above for someone to join!</div>
      )}

      <style>{`
        .waiting-room { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 800px; margin: 0 auto; margin-top: 2rem; }
        .room-header { display: flex; justify-content: space-between; width: 100%; color: var(--sub-color); align-items: center; }
        .room-code { color: var(--main-color); font-size: 1.5rem; letter-spacing: 2px; }
        .leave-btn { background: transparent; border: 1px solid var(--sub-color); color: var(--sub-color); padding: 0.4rem 1rem; border-radius: 4px; cursor: pointer; }
        .leave-btn:hover { color: var(--error-color); border-color: var(--error-color); }
        .players-container { display: flex; align-items: center; justify-content: space-between; width: 100%; background: var(--sub-alt-color); padding: 2rem; border-radius: 8px; }
        .player-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .player-name { font-size: 1.5rem; color: var(--text-color); }
        .status { padding: 0.4rem 1rem; border-radius: 4px; font-size: 0.9rem; font-weight: bold; }
        .status.ready { background: var(--main-color); color: var(--bg-color); }
        .status.not-ready { background: var(--bg-color); color: var(--sub-color); border: 1px solid var(--sub-color); }
        .vs { font-size: 2rem; color: var(--sub-color); font-weight: bold; margin: 0 2rem; }
        .waiting-text { color: var(--sub-color); font-style: italic; }
        .ready-btn { padding: 1rem 3rem; font-size: 1.5rem; font-weight: bold; background: var(--main-color); color: var(--bg-color); border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .ready-btn.is-ready { background: var(--sub-color); }
        .ready-btn:hover { opacity: 0.9; transform: scale(1.05); }
        .waiting-instruction { color: var(--sub-color); }
      `}</style>
    </div>
  );

  const renderFinished = () => {
    const isWinner = winnerId === localId;
    const oppStats = opponent;

    return (
      <div className="finished-screen animation-fade">
        <div className={`result-banner ${isWinner ? 'win' : 'lose'}`}>
          {isWinner ? 'YOU WIN!' : 'MATCH LOST'}
        </div>
        
        <div className="stats-container">
          <h2>Your Stats</h2>
          <div className="main-stats">
            <div className="stat-group">
              <label>wpm</label>
              <div className="val">{Math.round(localStats?.wpm || 0)}</div>
            </div>
            <div className="stat-group">
              <label>acc</label>
              <div className="val">{Math.round(localStats?.accuracy || 0)}%</div>
            </div>
            <div className="stat-group">
              <label>time</label>
              <div className="val">{Math.round(localStats?.testTime || 0)}s</div>
            </div>
          </div>
        </div>

        {oppStats && (
          <div className="opponent-stats-toggle">
            <button onClick={() => setShowOpponentStats(!showOpponentStats)}>
               {showOpponentStats ? 'Hide' : 'Show'} opponent stats
            </button>
            {showOpponentStats && (
              <div className="opponent-main-stats">
                 <div className="stat-group">
                    <label>{oppStats.name} wpm</label>
                    <div className="val sm">{Math.round(oppStats.wpm || 0)}</div>
                 </div>
                 <div className="stat-group">
                    <label>acc</label>
                    <div className="val sm">{Math.round(oppStats.accuracy || 0)}%</div>
                 </div>
                 <div className="stat-group">
                    <label>progress</label>
                    <div className="val sm">{Math.round(oppStats.progress || 0)}%</div>
                 </div>
              </div>
            )}
          </div>
        )}

        <div className="end-actions">
           <button className="rematch-btn" onClick={rematch}>Rematch</button>
           <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
        </div>

        <style>{`
          .finished-screen { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 800px; margin: 0 auto; margin-top: 1rem; }
          .result-banner { font-size: 3rem; font-weight: bold; text-align: center; width: 100%; padding: 1rem; border-radius: 8px; }
          .result-banner.win { background: var(--main-color); color: var(--bg-color); }
          .result-banner.lose { background: var(--error-color); color: var(--bg-color); }
          .stats-container { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; background: var(--sub-alt-color); padding: 2rem; border-radius: 8px; }
          .stats-container h2 { margin: 0; color: var(--sub-color); font-weight: normal; }
          .main-stats { display: flex; gap: 3rem; justify-content: center; }
          .stat-group { display: flex; flex-direction: column; align-items: center; }
          .stat-group label { color: var(--sub-color); font-size: 1rem; margin-bottom: 0.5rem; }
          .stat-group .val { font-size: 4rem; color: var(--text-color); font-weight: bold; line-height: 1; }
          .stat-group .val.sm { font-size: 2rem; }
          
          .opponent-stats-toggle { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .opponent-stats-toggle button { background: transparent; border: none; color: var(--sub-color); text-decoration: underline; cursor: pointer; font-size: 1rem; }
          .opponent-stats-toggle button:hover { color: var(--text-color); }
          .opponent-main-stats { display: flex; gap: 2rem; justify-content: center; background: rgba(0,0,0,0.1); padding: 1rem 2rem; border-radius: 8px; border: 1px solid var(--sub-alt-color); }

          .end-actions { display: flex; gap: 1rem; margin-top: 1rem; }
          .rematch-btn { padding: 0.8rem 2rem; font-size: 1.2rem; background: var(--text-color); color: var(--bg-color); border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
          .rematch-btn:hover { background: var(--main-color); }
          .leave-btn { padding: 0.8rem 2rem; font-size: 1.2rem; background: transparent; color: var(--sub-color); border: 1px solid var(--sub-color); border-radius: 4px; cursor: pointer; }
          .leave-btn:hover { color: var(--error-color); border-color: var(--error-color); }
        `}</style>
      </div>
    );
  };

  if (state === 'lobby') return renderLobby();
  if (state === 'finding_match') return renderFindingMatch();
  if (state === 'waiting') return renderWaiting();
  if (state === 'finished') return renderFinished();

  let globalCharIndex = 0;
  const localProg = (typedChars.length / (Math.max(targetText.length, 1))) * 100;
  const oppProg = opponent?.progress || 0;

  return (
    <div className="typing-wrapper animation-fade">
      {/* Target Progress Bars */}
      <div className="race-progress-container">
        <div className="race-track local">
           <div className="car" style={{ left: `${localProg}%` }}>🚗 You</div>
        </div>
        <div className="race-track opponent">
           <div className="car" style={{ left: `${oppProg}%` }}>🏎️ {opponent?.name || 'Opponent'}</div>
        </div>
      </div>

      {state === 'starting' && (
        <div className="countdown-overlay">
           <div className="countdown">{countdown}</div>
        </div>
      )}

      <div className="words-viewport" style={{ opacity: state === 'starting' ? 0.3 : 1, filter: state === 'starting' ? 'blur(2px)' : 'none' }}>
        <div 
          className="words" 
          tabIndex={0} 
          autoFocus={state === 'typing'}
          ref={wordsContainerRef}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
           {state === 'typing' && (
             <div 
               className="caret" 
               style={{ 
                 left: caretPos.left, 
                 top: caretPos.top,
                 opacity: 1 
               }} 
             />
           )}
           
           {words.map((word, wIdx) => {
             const isLastWord = wIdx === words.length - 1;
             const letters = word.split('');
             
             return (
               <div key={wIdx} className="word">
                 {letters.map((char, lIdx) => {
                   const isTyped = globalCharIndex < typedChars.length;
                   const isActive = globalCharIndex === typedChars.length;
                   const typedChar = typedChars[globalCharIndex];
                   
                   let charClass = "letter ";
                   if (isActive) charClass += "active";
                   else if (isTyped) {
                     if (typedChar === char) charClass += "correct";
                     else charClass += "incorrect";
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
        .typing-wrapper { position: relative; width: 100%; font-family: 'Roboto Mono', monospace; font-size: 1.8rem; line-height: 1.5; outline: none; margin-top: 1rem; }
        
        .race-progress-container { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; background: var(--sub-alt-color); padding: 1rem; border-radius: 8px; }
        .race-track { position: relative; width: 100%; height: 2px; background: var(--bg-color); margin: 10px 0; border-radius: 2px; }
        .race-track.opponent { background: rgba(255,100,100,0.2); }
        .car { position: absolute; top: -14px; font-size: 1rem; line-height: 1; transform: translateX(-50%); transition: left 0.1s linear; color: var(--sub-color); font-family: sans-serif; white-space: nowrap; }
        .race-track.local .car { color: var(--main-color); font-weight: bold; }
        .race-track.opponent .car { color: #ff6666; }

        .countdown-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; pointer-events: none; }
        .countdown { font-size: 8rem; color: var(--main-color); font-weight: bold; animation: pulse 1s infinite; text-shadow: 0 0 20px rgba(0,0,0,0.5); }

        .words-viewport { max-height: 108px; overflow: hidden; position: relative; transition: all 0.3s; }
        .words { display: flex; flex-wrap: wrap; user-select: none; gap: 0 0.5em; outline: none; position: relative; transition: transform 0.2s ease-out; }
        .word { display: flex; margin-bottom: 0px; height: 36px; }
        .letter { transition: color 0.1s; color: var(--sub-color); }
        .letter.correct { color: var(--text-color); }
        .letter.incorrect { color: var(--error-color); }
        .letter.incorrect.extra { color: var(--error-extra-color); }
        .letter.space { width: 0.5em; }
        
        .caret { position: absolute; width: 3px; height: 1.8rem; background-color: var(--caret-color); transition: left 0.1s ease, top 0.1s ease; border-radius: 2px; z-index: 10; margin-top: 0.2rem; }
        .typing-wrapper:focus-within .caret { animation: caretFlash 1s infinite; }
        
        @keyframes caretFlash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
        .animation-fade { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};
