import React, { useEffect, useState } from 'react';
import { SPELLS } from '../data/spells';
import { socket } from '../services/socket';

interface RestingRoundProps {
  round: number;
  roomId: string;
}

export const RestingRound: React.FC<RestingRoundProps> = ({ round, roomId }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSelectSpell = (spellId: string) => {
    setSelectedSpellId(spellId);
    socket.emit('select_spell', { roomId, spellId });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-slate-200">INTERMISSION</h2>
        <p className="text-slate-400">Choose your weapon for Round {round + 1}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 w-full animate-fade-in-up md:px-12">
        {SPELLS.map(spell => (
          <button
            key={spell.id}
            onClick={() => handleSelectSpell(spell.id)}
            className={`
              relative p-6 rounded-2xl border text-left transition-all duration-300 group
              ${selectedSpellId === spell.id 
                ? 'bg-indigo-600/20 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-500'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className={`font-bold font-mono text-lg ${selectedSpellId === spell.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                {spell.name}
              </h3>
              {selectedSpellId === spell.id && (
                <span className="text-indigo-400 animate-pulse-slow">●</span>
              )}
            </div>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
              {spell.description}
            </p>
          </button>
        ))}
      </div>

      <div className="text-xl font-mono text-green-400 animate-pulse">
        Next round starts in {timeLeft}...
      </div>
    </div>
  );
};
