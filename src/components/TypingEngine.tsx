import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';

interface TypingEngineProps {
  text: string;
  onComplete?: () => void;
  disabled?: boolean;
  initialSpells?: string[];
}

export const TypingEngine: React.FC<TypingEngineProps> = ({ 
  text, onComplete, disabled, initialSpells = []
}) => {
  const [localText, setLocalText] = useState(text);
  const [userInput, setUserInput] = useState('');
  
  // Ref to track userInput without re-binding effects constantly
  const userInputRef = useRef(userInput);
  
  const [isFrozen, setIsFrozen] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Sync Ref
  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

  // Initialize text with any active spells applied immediately
  useEffect(() => {
    let modifiedText = text;
    
    // Apply Start-of-Round Spells
    if (initialSpells.includes('symbol_storm')) {
       const storm = ";{{/.";
       // Insert at start since game just started
       modifiedText = storm + modifiedText; 
       console.log('Applied Symbol Storm at start');
    }

    setLocalText(modifiedText);
    setUserInput('');
    setIsFrozen(false);
  }, [text, initialSpells]);

  // Handle Receiving Spells (Mid-Round or others)
  useEffect(() => {
    const handleReceiveSpell = (data: { spellId: string, casterId: string }) => {
      console.log('SPELL HIT CLIENT:', data);
      
      if (data.spellId === 'symbol_storm') {
        const storm = ";{{/.";
        setLocalText(prev => {
           // Insert at current cursor position
           const cursor = userInputRef.current.length;
           const before = prev.slice(0, cursor);
           const after = prev.slice(cursor);
           return before + storm + after;
        });
        triggerPenalty(); // Brief freeze/shake to indicate impact
      }
    };

    socket.on('receive_spell', handleReceiveSpell);
    return () => { socket.off('receive_spell', handleReceiveSpell); };
  }, []); // Empty dependency array = stable listener for lifecycle

  // Handle global keydown events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || isFrozen) return;

      // Ignore modifiers
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return; 

      e.preventDefault();

      const expectedChar = localText[userInput.length];
      
      if (e.key === expectedChar) {
        const nextInput = userInput + e.key;
        setUserInput(nextInput);
        
        if (nextInput === localText) {
          onComplete?.();
        }
      } else {
        triggerPenalty();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userInput, isFrozen, localText, onComplete, disabled]);

  const triggerPenalty = () => {
    setIsFrozen(true);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setIsFrozen(false), 1000);
  };

  return (
    <div className="typing-container relative">
      
      {/* Visual Feedback for Freeze */}
      {isFrozen && (
        <div className="freeze-badge">
           FROZEN (1s)
        </div>
      )}

      {/* Text Display */}
      <div className={`paragraph-display ${shake ? 'text-shake' : ''}`}>
        {localText.split('').map((char, index) => {
          let className = "char-future";
          if (index < userInput.length) {
            className = "char-correct";
          } else if (index === userInput.length) {
            className = "char-cursor";
          }
          
          return (
            <span key={index} className={className}>
              {char}
            </span>
          );
        })}
      </div>
      
      {/* Instructions */}
      <div className={`
        mt-12 text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300
        ${isFrozen ? 'text-red-500 animate-pulse' : 'text-slate-500'}
      `}>
          {isFrozen ? "❄️ Frozen - Wait!" : "Type the text above to race"}
      </div>

    </div>
  );
};
