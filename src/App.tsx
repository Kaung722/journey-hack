import { useState } from 'react'
import { TypingEngine } from './components/TypingEngine'
import { RestingRound } from './components/RestingRound'
import { ROUND_TEXTS } from './data/gameData'

type GameState = 'intro' | 'playing' | 'resting' | 'victory';

function App() {
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [mana, setMana] = useState(0);

  const currentText = ROUND_TEXTS[round as keyof typeof ROUND_TEXTS];

  const handleRoundComplete = () => {
    if (round === 3) {
      setGameState('victory');
    } else {
      setGameState('resting');
      // Potential Mana Award logic here
      setMana(m => m + 2); 
    }
  };

  const handleNextRound = () => {
    setRound(r => r + 1);
    setGameState('playing');
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="text-2xl font-bold tracking-tighter text-white">TYPE TACTICS</h1>
        <div className="header-stats">
          <span>ROUND {round > 3 ? 3 : round}/3</span>
          <span>MANA: {mana}</span>
        </div>
      </header>

      <main style={{ marginTop: '4rem', width: '100%' }}>
        {gameState === 'playing' && (
          <TypingEngine 
            key={round} // Reset state on round change
            text={currentText} 
            onComplete={handleRoundComplete} 
          />
        )}

        {gameState === 'resting' && (
          <RestingRound round={round} onNext={handleNextRound} />
        )}

        {gameState === 'victory' && (
          <div className="round-end animate-fade-in-up">
            <h2 style={{ fontSize: '4rem', color: '#fbbf24' }}>VICTORY</h2>
            <p>You have conquered the keyboard.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-next"
            >
              Play Again
            </button>
          </div>
        )}
      </main>

    </div>
  )
}

export default App
