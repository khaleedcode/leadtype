import React from 'react'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile, onOpenAuth, onGoHome }) => {
  const { user, loading } = useAuth()

  return (
    <header>
      <div className="logo" onClick={onGoHome} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onGoHome() }}>
        <h1>leadtype</h1>
      </div>
      <div className="nav">
        {!loading && (
           user ? (
             <button className="nav-btn" onClick={onOpenProfile}>
               <span className="icon">👤</span> {user.email?.split('@')[0]}
             </button>
           ) : (
             <button className="nav-btn" onClick={onOpenAuth}>
               <span className="icon">👤</span> login
             </button>
           )
        )}
      </div>
      <style>{`
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1000px;
          margin-bottom: 2rem;
        }
        .logo h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--main-color);
          margin: 0;
        }
        .nav-btn {
          background: none;
          border: none;
          color: var(--sub-color);
          cursor: pointer;
          font-family: inherit;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.2s;
        }
        .nav-btn:hover {
          color: var(--text-color);
        }
        .icon {
          font-size: 1.2rem;
        }
      `}</style>
    </header>
  )
}
