import React, { useEffect, useState } from 'react';

interface RestingRoundProps {
  round: number;
}

export const RestingRound: React.FC<RestingRoundProps> = ({ round }) => {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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

      <div className="text-2xl font-mono text-green-400">
        Next round starts in {timeLeft}...
      </div>
    </div>
  );
};
