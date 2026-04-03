import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthProps {
  onClose: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onClose()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            }
          }
        })
        if (error) throw error
        alert('Check your email for the login link!')
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Sign In' : 'Register'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleAuth}>
        {!isLogin && (
           <input 
             type="text" 
             placeholder="Username" 
             value={username} 
             onChange={(e) => setUsername(e.target.value)}
           />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>
      <div className="toggle">
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          background: var(--sub-alt-color);
          padding: 2rem;
          border-radius: 0.5rem;
          animation: fadeIn 0.3s ease;
        }
        .auth-container h2 {
          color: var(--text-color);
          margin-bottom: 1.5rem;
        }
        .error {
          color: var(--error-color);
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-align: center;
        }
        .auth-container form {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 1rem;
        }
        .auth-container input {
          background: var(--bg-color);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.25rem;
          color: var(--text-color);
          font-family: inherit;
        }
        .auth-container input:focus {
          outline: 2px solid var(--caret-color);
        }
        .auth-container button[type="submit"] {
          background: var(--caret-color);
          color: var(--bg-color);
          border: none;
          padding: 0.75rem;
          border-radius: 0.25rem;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .auth-container button[type="submit"]:hover {
          opacity: 0.9;
        }
        .toggle {
          margin-top: 1.5rem;
        }
        .toggle button {
          background: none;
          border: none;
          color: var(--sub-color);
          cursor: pointer;
          font-family: inherit;
        }
        .toggle button:hover {
          color: var(--text-color);
        }
      `}</style>
    </div>
  )
}
