import { useState } from 'react'
import { TypingEngine } from './components/TypingEngine'

function App() {
  const [round, setRound] = useState(1);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');

  // Round 1 sample text
  const text = "The quick brown fox jumps over the lazy dog.";

  const handleComplete = () => {
    setGameStatus('won');
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="text-2xl font-bold tracking-tighter text-white">TYPE TACTICS</h1>
        <div className="header-stats">
          <span>ROUND {round}/3</span>
          <span>MANA: 0</span>
        </div>
      </header>

      <main style={{ marginTop: '4rem', width: '100%' }}>
        {gameStatus === 'playing' ? (
          <TypingEngine text={text} onComplete={handleComplete} />
        ) : (
          <div className="round-end animate-fade-in-up">
            <h2>ROUND COMPLETE</h2>
            <p style={{ color: '#94a3b8' }}>Refreshing mana...</p>
            <button 
              onClick={() => {
                setGameStatus('playing'); 
                setRound(r => r + 1);
              }}
              className="btn-next"
            >
              Next Round
            </button>
          </div>
        )}
      </main>

    </div>
  )
}

export default App
