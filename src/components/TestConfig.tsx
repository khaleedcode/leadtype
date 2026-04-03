import React from 'react';
import { TestMode } from '../App';

interface TestConfigProps {
  mode: TestMode;
  setMode: (m: TestMode) => void;
  amount: number;
  setAmount: (a: number) => void;
  onMultiplayerSelect?: () => void;
}

export const TestConfig: React.FC<TestConfigProps> = ({ mode, setMode, amount, setAmount, onMultiplayerSelect }) => {

  const timeOptions = [15, 30, 60, 120];
  const wordsOptions = [10, 25, 50, 100];
  
  const currentOptions = mode === 'time' ? timeOptions : wordsOptions;

  return (
    <div className="test-config">
      <div className="modes">
        <button 
          className={mode === 'generated' ? 'active' : ''} 
          onClick={() => { setMode('generated'); setAmount(15); }}
        >
          generated
        </button>
        <button className="disabled">punctuation</button>
        <button className="disabled">numbers</button>
        <div className="divider"></div>
        <button className={mode === 'time' ? 'active' : ''} onClick={() => { setMode('time'); setAmount(15); }}>time</button>
        <button className={mode === 'words' ? 'active' : ''} onClick={() => { setMode('words'); setAmount(25); }}>words</button>
        <div className="divider"></div>
        <button className="multiplayer-btn" onClick={onMultiplayerSelect}>1v1 race</button>
      </div>
      <div className="divider"></div>
      <div className="amounts">
        {currentOptions.map(opt => (
          <button 
            key={opt} 
            className={amount === opt ? 'active' : ''}
            onClick={() => setAmount(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <style>{`
        .test-config {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background-color: var(--sub-alt-color);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          align-items: center;
        }
        .modes, .amounts {
          display: flex;
          gap: 1rem;
        }
        .divider {
          width: 4px;
          height: 1.5rem;
          background-color: var(--bg-color);
          border-radius: 2px;
        }
        .test-config button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          text-decoration: line-through;
        }
        .multiplayer-btn {
          color: var(--caret-color);
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
