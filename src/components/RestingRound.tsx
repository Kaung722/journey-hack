import React from 'react';

interface RestingRoundProps {
  round: number;
  onNext: () => void;
}

export const RestingRound: React.FC<RestingRoundProps> = ({ round, onNext }) => {
  return (
    <div className="round-end animate-fade-in-up">
      <h2>ROUND {round} COMPLETE</h2>
      <p style={{ color: '#94a3b8', fontSize: '1.25rem', margin: '2rem 0' }}>
        Take a deep breath...
      </p>
      
      <div style={{ marginBottom: '3rem' }}>
        {/* Placeholder for future Mana/Spell selection */}
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          (Mana System Offline)
        </p>
      </div>

      <button 
        onClick={onNext}
        className="btn-next"
        style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}
      >
        START ROUND {round + 1}
      </button>
    </div>
  );
};
