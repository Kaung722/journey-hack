import React, { useState, useEffect, useRef } from 'react';

interface TypingEngineProps {
  text: string;
  onComplete?: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({ text, onComplete }) => {
  const [userInput, setUserInput] = useState('');
  const [isFrozen, setIsFrozen] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and keep focus
  useEffect(() => {
    inputRef.current?.focus();
    const handleBlur = () => setTimeout(() => inputRef.current?.focus(), 10);
    window.addEventListener('blur', handleBlur); // Re-focus if window loses focus? Maybe too aggressive.
    // Better: click anywhere to focus
    const handleClick = () => inputRef.current?.focus();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (userInput === text) {
      onComplete?.();
    }
  }, [userInput, text, onComplete]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFrozen) return;

    const val = e.target.value;
    
    // We only care about the last character typed if it's an addition
    if (val.length < userInput.length) {
       // Backspace allowed? strict typing usually doesn't allow backspace if we want "one shot"
       // But user request says "Any typo = 1-second keyboard freeze".
       // Typically in these games, you can't backspace confirmed correct letters, 
       // but you can't type incorrect ones. 
       // Let's implement: input value MUST match the substring of text.
       // If user types wrong char, we freeze and DON'T append it.
       return; 
    }
    
    const char = val.slice(-1);
    const expectedChar = text[userInput.length];

    if (val.length > userInput.length && char === expectedChar) {
       setUserInput(val);
    } else if (val.length > userInput.length) {
       // Wrong character typed
       triggerPenalty();
    }
  };

  const triggerPenalty = () => {
    setIsFrozen(true);
    setShake(true);
    
    // Remove shake class after animation
    setTimeout(() => setShake(false), 500);
    
    // Unfreeze after 1 second
    setTimeout(() => setIsFrozen(false), 1000);
  };

  return (
    <div className="typing-container">
      
      {/* Visual Feedback for Freeze */}
      {isFrozen && (
        <div className="freeze-badge">
          FROZEN (1s)
        </div>
      )}

      {/* Text Display */}
      <div className={`paragraph-display ${shake ? 'text-shake' : ''}`}>
        {text.split('').map((char, index) => {
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

      {/* Hidden Input for Logic */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInput}
        className="hidden-input"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      
      <div className="status-message">
        {isFrozen ? "Type frozen! Wait..." : "Start typing..."}
      </div>
    </div>
  );
};
