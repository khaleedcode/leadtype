import { useState } from 'react'
import './styles/theme.css'
import { TypingArea } from './components/TypingArea'
import { TestConfig } from './components/TestConfig'
import { Header } from './components/Header'
import { AuthProvider } from './context/AuthContext'
import { Auth } from './components/Auth'
import { Profile } from './components/Profile'
import { MultiplayerArea } from './components/MultiplayerArea'

export type TestMode = 'time' | 'words' | 'generated' | 'multiplayer';

function AppContent() {
  const [mode, setMode] = useState<TestMode>('time');
  const [amount, setAmount] = useState<number>(15);
  const [view, setView] = useState<'typing' | 'auth' | 'profile' | 'multiplayer'>('typing')
  const [resetKey, setResetKey] = useState<number>(0)

  const handleGoHome = () => {
    setView('typing');
    setResetKey(k => k + 1);
  }

  return (
    <div className="app">
      <Header 
        onOpenAuth={() => setView('auth')} 
        onOpenProfile={() => setView('profile')} 
        onGoHome={handleGoHome}
      />
      <main>
        {view === 'typing' && (
          <>
            <TestConfig 
              mode={mode} 
              setMode={setMode} 
              amount={amount} 
              setAmount={setAmount}
              onMultiplayerSelect={() => setView('multiplayer')}
            />
            <TypingArea key={`${mode}-${amount}-${resetKey}`} mode={mode} amount={amount} />
          </>
        )}
        {view === 'multiplayer' && (
          <MultiplayerArea onBack={() => setView('typing')} />
        )}
        {view === 'auth' && (
          <Auth onClose={() => setView('typing')} />
        )}
        {view === 'profile' && (
          <Profile onClose={() => setView('typing')} />
        )}
      </main>
      <footer>
        <p>theme: dark | leadtype © 2026</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
