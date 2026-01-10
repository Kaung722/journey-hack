import React, { useState, useEffect } from 'react';

interface TypingEngineProps {
  text: string;
  onComplete?: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({ text, onComplete }) => {
  const [userInput, setUserInput] = useState('');
  const [isFrozen, setIsFrozen] = useState(false);
  const [shake, setShake] = useState(false);

  // Handle global keydown events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFrozen) return;

      // Ignore modifiers and non-printable keys (except potential future backspace)
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return; // Only single characters

      e.preventDefault(); // Prevent default browser actions (like scrolling with space)

      const expectedChar = text[userInput.length];
      
      // Strict matching: Only accept the correct character
      if (e.key === expectedChar) {
        const nextInput = userInput + e.key;
        setUserInput(nextInput);
        
        if (nextInput === text) {
          onComplete?.();
        }
      } else {
        // Wrong character typed
        triggerPenalty();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userInput, isFrozen, text, onComplete]);

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
      
      <div className="status-message">
        {isFrozen ? "Type frozen! Wait..." : "Start typing..."}
      </div>
    </div>
  );
};
