
import { useState, useEffect, useRef } from 'react'
import { TypingEngine } from './components/TypingEngine'
import { RestingRound } from './components/RestingRound'
import { ROUND_TEXTS } from './data/gameData'
import { socket } from './services/socket'

type GameState = 'lobby' | 'racing' | 'waiting' | 'scoreboard' | 'strategy' | 'victory';

interface Player {
  id: string;
  name: string;
  finishTime: number | null;
  roundDuration?: number;
  totalDuration?: number;
  isHost?: boolean;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [round, setRound] = useState(1);
  const [mana, setMana] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Rankings for scoreboard
  const [rankings, setRankings] = useState<Player[]>([]);
  
  // Timing
  const startTimeRef = useRef<number | null>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Socket Event Listeners

    socket.on('room_update', (room) => {
      console.log('Received room_update:', room);
      setPlayers(room.players);
      
      // Sync game state if joining late or reconnecting (basic sync)
      if (room.status === 'victory') {
         setGameState('victory');
      }
    });

    socket.on('global_start_round', ({ round }) => {
      console.log('Received global_start_round:', round);
      setRound(round);
      
      // Start Countdown
      setCountdown(3);
      setGameState('racing');
      setNotifications([]); // Clear for new round
    });

    socket.on('round_finished', ({ rankings }) => {
      setRankings(rankings);
      setGameState('scoreboard');
    });
    
    socket.on('player_finished', ({ name, rank }) => {
       const suffix = (r: number) => {
         if (r === 1) return 'st';
         if (r === 2) return 'nd';
         if (r === 3) return 'rd';
         return 'th';
       }
       setNotifications(prev => [...prev, `${name} finished ${rank}${suffix(rank)}!`]);
    });

    socket.on('game_over', ({ rankings }) => {
      setRankings(rankings);
      setGameState('victory');
    });

    return () => {
      socket.off('room_update');
      socket.off('global_start_round');
      socket.off('round_finished');
      socket.off('player_finished');
      socket.off('game_over');
    };
  }, []);

  // Countdown Logic
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => (c as number) - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null); // Finished
      startTimeRef.current = Date.now(); // START TIMER
    }
  }, [countdown]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId && username) {
      socket.emit('join_room', { roomId, username });
    }
  };

  const handleStartGame = () => {
    console.log('Starting game for room:', roomId);
    socket.emit('start_game', roomId);
  };


  const handleRaceComplete = () => {
    // User finished typing
    setGameState('waiting');
    
    const endTime = Date.now();
    const duration = startTimeRef.current ? endTime - startTimeRef.current : 0;
    
    socket.emit('submit_result', { roomId, duration });
  };
  
  // Find current player to check if Host
  const me = players.find(p => p.id === socket.id);
  const isHost = me?.isHost;

  return (
    <div className="container">
      <header className="header">
        <h1 className="text-2xl font-bold tracking-tighter text-white">TYPE TACTICS</h1>
        <div className="header-stats">
          <span>{gameState === 'lobby' ? 'LOBBY' : gameState === 'victory' ? 'VICTORY' : `ROUND ${round}/3`}</span>
          <span>MANA: {mana}</span>
        </div>
      </header>

      <main style={{ marginTop: '4rem', width: '100%' }}>
        
        {/* LOBBY VIEW */}
        {gameState === 'lobby' && (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-green-400">Join Lobby</h2>
            
            {players.length === 0 ? (
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4 w-64">
                <input 
                  className="p-2 rounded bg-slate-800 text-white border border-slate-700"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <input 
                  className="p-2 rounded bg-slate-800 text-white border border-slate-700"
                  placeholder="Room ID (e.g. room1)"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                />
                <button type="submit" className="btn-next">Join Room</button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4">
                 <p className="text-slate-400">Room: <span className="text-white font-mono">{roomId}</span></p>
                 <div className="bg-slate-800 p-4 rounded w-64">
                    <h3 className="text-sm font-bold text-slate-500 mb-2">PLAYERS ({players.length})</h3>
                    {players.map(p => (
                      <div key={p.id} className="text-green-300 font-mono flex justify-between">
                         <span>{p.id === socket.id ? '> ' : ''}{p.name}</span>
                         {p.isHost && <span className="text-yellow-500 text-xs border border-yellow-500 px-1 rounded">HOST</span>}
                      </div>
                    ))}
                 </div>
                 
                 {isHost ? (
                    <button onClick={handleStartGame} className="btn-next mt-4">Start Game</button>
                 ) : (
                    <p className="text-slate-500 animate-pulse mt-4">Waiting for host to start...</p>
                 )}
              </div>
            )}
          </div>
        )}

        {/* RACING VIEW */}
        {gameState === 'racing' && (
          <>
            {/* NOTIFICATIONS */}
            <div className="absolute top-20 right-4 flex flex-col gap-2 z-50 pointer-events-none">
              {notifications.map((msg, i) => (
                <div key={i} className="bg-slate-800/90 border border-green-500/30 text-green-300 px-4 py-2 rounded shadow-lg animate-fade-in text-sm font-mono">
                  {msg}
                </div>
              ))}
            </div>

            {countdown !== null && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-9xl font-bold text-white animate-pulse">
                  {countdown > 0 ? countdown : "GO!"}
                </div>
              </div>
            )}
            
            <TypingEngine 
              key={round}
              text={ROUND_TEXTS[round as keyof typeof ROUND_TEXTS]} 
              onComplete={handleRaceComplete} 
              disabled={countdown !== null}
            />
          </>
        )}

        {/* WAITING VIEW */}
        {gameState === 'waiting' && (
           <div className="round-end animate-fade-in-up">
              <h2>FINISHED!</h2>
              <p className="text-slate-400">Waiting for other players...</p>
              
              {/* Also show notifications here just in case */}
              <div className="flex flex-col gap-2 mt-4 items-center">
                  {notifications.map((msg, i) => (
                    <div key={i} className="text-slate-500 text-sm font-mono">
                      {msg}
                    </div>
                  ))}
              </div>
           </div>
        )}

        {/* SCOREBOARD / INTERMISSION VIEW */}
        {gameState === 'scoreboard' && (
          <div className="round-end animate-fade-in-up">
            <h2>ROUND {round} RESULTS</h2>
            <div className="flex flex-col gap-2 my-4 bg-slate-800 p-6 rounded items-start max-w-md mx-auto">
               {rankings.map((p, i) => (
                 <div key={p.id} className="flex justify-between w-full font-mono text-lg gap-8">
                    <span className={p.id === socket.id ? 'text-green-400 font-bold' : 'text-slate-300'}>
                      #{i+1} {p.name}
                    </span>
                    <span className="text-yellow-400">
                      {p.roundDuration ? (p.roundDuration / 1000).toFixed(2) + 's' : '-'}
                    </span>
                 </div>
               ))}
            </div>
            
            <RestingRound round={round} />
          </div>
        )}

        {/* VICTORY VIEW */}
        {gameState === 'victory' && (
          <div className="round-end animate-fade-in-up">
            <h2 className="text-4xl text-yellow-500 mb-4">FINAL LEADERBOARD</h2>
            <div className="flex flex-col gap-2 my-4 bg-slate-800 p-6 rounded items-start max-w-md mx-auto border-2 border-yellow-600">
               {rankings.map((p, i) => (
                 <div key={p.id} className="flex justify-between w-full font-mono text-lg gap-8">
                    <span className={p.id === socket.id ? 'text-green-400 font-bold' : 'text-slate-300'}>
                      #{i+1} {p.name}
                    </span>
                    <span className="text-yellow-400 font-bold">
                       {p.totalDuration ? (p.totalDuration / 1000).toFixed(2) + 's' : '-'}
                    </span>
                 </div>
               ))}
            </div>
            
            {isHost ? (
               <button 
                 onClick={handleStartGame}
                 className="btn-next mt-8"
                 style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
               >
                 PLAY AGAIN
               </button>
            ) : (
               <p className="text-slate-400 mt-8 animate-pulse">Waiting for host to restart...</p>
            )}
            
            {!isHost && <p className="text-slate-600 text-sm mt-4">(Only host can restart)</p>}
          </div>
        )}

      </main>

    </div>
  )
}

export default App
