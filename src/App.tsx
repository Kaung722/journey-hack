
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
  selectedSpell?: string | null;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [round, setRound] = useState(1);
  const [initialSpells, setInitialSpells] = useState<string[]>([]);
  const [mana] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Rankings for scoreboard
  const [rankings, setRankings] = useState<Player[]>([]);
  
  // Timing
  const startTimeRef = useRef<number | null>(null);

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

    socket.on('global_start_round', ({ round, activeSpells }) => {
      console.log('Received global_start_round:', round, activeSpells);
      setRound(round);
      
      // Check if we are targeted by any spells
      const mySpells = activeSpells?.[socket.id || ''] || [];
      setInitialSpells(mySpells);

      // Only do countdown for Round 1 (Lobby -> Game)
      // For R2/R3, we just came from intermission which has its own timer.
      if (round === 1) {
        setCountdown(3);
      } else {
        setCountdown(null);
        startTimeRef.current = Date.now();
      }
      
      setGameState('racing');
    });

    socket.on('round_finished', ({ rankings }) => {
      setRankings(rankings);
      setGameState('scoreboard');
    });

    socket.on('game_over', ({ rankings }) => {
      setRankings(rankings);
      setGameState('victory');
    });

    return () => {
      socket.off('room_update');
      socket.off('global_start_round');
      socket.off('round_finished');
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
      // Countdown is 0 (GO!), hold for a brief moment then start
      const timer = setTimeout(() => {
        setCountdown(null);
        startTimeRef.current = Date.now(); // START TIMER
      }, 500); // 0.5s duration for "GO!"
      return () => clearTimeout(timer);
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


  const handleRaceComplete = (bonusMs = 0) => {
    // User finished typing
    setGameState('waiting');
    
    const endTime = Date.now();
    let duration = startTimeRef.current ? endTime - startTimeRef.current : 0;
    
    // Apply Time Warp buff
    if (bonusMs > 0) {
        duration = Math.max(0, duration - bonusMs);
        console.log(`Applied Time Warp: Reduced by ${bonusMs}ms, New Duration: ${duration}`);
    }
    
    socket.emit('submit_result', { roomId, duration });
  };
  
  // Find current player to check if Host
  const me = players.find(p => p.id === socket.id);
  const isHost = me?.isHost;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 font-sans text-slate-200">
      <header className="w-full max-w-5xl flex justify-between items-center mb-12 glass-panel rounded-full px-8 py-4 sticky top-4 z-50">
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 drop-shadow-sm">
          TYPE TACTICS
        </h1>
        <div className="flex items-center gap-6 font-mono text-sm font-bold text-slate-400">
          <span className="bg-slate-800/50 px-3 py-1 rounded-full">
            {gameState === 'lobby' ? 'LOBBY' : gameState === 'victory' ? 'VICTORY' : `ROUND ${round}/3`}
          </span>
          <span className="hidden sm:inline">MANA: {mana}</span>
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center relative">
        
        {/* LOBBY VIEW */}
        {gameState === 'lobby' && (
          <div className="glass-panel p-10 rounded-3xl flex flex-col items-center gap-8 w-full max-w-lg animate-fade-in-up border border-slate-700/50">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Enter the Arena</h2>
              <p className="text-slate-400">Join a room to compete in real-time speed typing.</p>
            </div>
            
            {players.length === 0 ? (
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4 w-full">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Username</label>
                  <input 
                    className="w-full p-4 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                    placeholder="e.g. Speedster"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Room ID</label>
                  <input 
                    className="w-full p-4 rounded-xl bg-slate-900/50 text-white border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-mono"
                    placeholder="e.g. room1"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                  />
                </div>
                <button type="submit" className="mt-4 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                  JOIN LOBBY
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-6 w-full">
                 <div className="bg-slate-900/80 p-4 rounded-xl w-full border border-slate-700/50">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Room: {roomId}</span>
                      <span className="text-xs font-bold text-green-500">{players.length} Players</span>
                    </div>
                    {players.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-slate-800/50 transition-colors">
                         <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${p.id === socket.id ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-slate-500'}`} />
                           <span className={`font-medium ${p.id === socket.id ? 'text-white' : 'text-slate-400'}`}>
                             {p.name} {p.id === socket.id && '(You)'}
                           </span>
                         </div>
                         {p.isHost && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">HOST</span>}
                      </div>
                    ))}
                 </div>
                 
                 {isHost ? (
                    <button onClick={handleStartGame} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                      START GAME
                    </button>
                 ) : (
                    <div className="flex items-center gap-3 text-slate-500 animate-pulse bg-slate-900/50 px-6 py-3 rounded-full">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
                      <span className="text-sm font-medium">Waiting for host...</span>
                    </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* RACING VIEW */}
        {gameState === 'racing' && (
          <>
            {countdown !== null ? (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                 <div className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-blue-500 animate-pulse drop-shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                   {countdown > 0 ? countdown : "GO!"}
                 </div>
               </div>
            ) : (
              <div className="w-full max-w-4xl glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                <TypingEngine 
                  key={round}
                  text={ROUND_TEXTS[round as keyof typeof ROUND_TEXTS]} 
                  onComplete={handleRaceComplete} 
                  disabled={false}
                  initialSpells={initialSpells}
                />
              </div>
            )}
          </>
        )}

        {/* WAITING VIEW */}
        {gameState === 'waiting' && (
           <div className="glass-panel p-12 rounded-3xl flex flex-col items-center animate-fade-in-up text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <span className="text-3xl">🏁</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">FINISHED!</h2>
              <p className="text-slate-400">You crushed it. Waiting for the slowpokes...</p>
              <div className="mt-8 flex gap-2">
                <div className="w-3 h-3 bg-slate-600 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-slate-600 rounded-full animate-bounce delay-75" />
                <div className="w-3 h-3 bg-slate-600 rounded-full animate-bounce delay-150" />
              </div>
           </div>
        )}

        {/* SCOREBOARD / INTERMISSION VIEW */}
        {gameState === 'scoreboard' && (
          <div className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in-up">
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50">
              <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Round {round} Results</h2>
              <div className="flex flex-col gap-3">
                 {rankings.map((p, i) => (
                   <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl ${p.id === socket.id ? 'bg-slate-700/50 border border-slate-600' : 'bg-slate-800/30'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono font-bold text-xl w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-600'}`}>#{i+1}</span>
                        <span className={`font-medium ${p.id === socket.id ? 'text-white' : 'text-slate-400'}`}>
                          {p.name} {p.id === socket.id && '(You)'}
                        </span>
                      </div>
                      <span className="font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded-lg">
                        {p.roundDuration ? (p.roundDuration / 1000).toFixed(2) + 's' : 'DNF'}
                      </span>
                   </div>
                 ))}
              </div>
            </div>
            
            <RestingRound 
                round={round} 
                roomId={roomId}
                rank={rankings.findIndex(p => p.id === socket.id)}
            />
          </div>
        )}

        {/* VICTORY VIEW */}
        {gameState === 'victory' && (
          <div className="glass-panel p-10 rounded-3xl flex flex-col items-center w-full max-w-2xl animate-fade-in-up border-t-4 border-yellow-500">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8 drop-shadow-sm uppercase italic transform -skew-x-6">
              CHAMPIONS
            </h2>
            
            <div className="w-full flex flex-col gap-3 mb-10">
               {rankings.map((p, i) => (
                 <div key={p.id} className={`flex justify-between items-center p-6 rounded-2xl relative overflow-hidden ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' : 'bg-slate-800/40'}`}>
                    {i === 0 && <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">👑</div>}
                    <div className="flex items-center gap-6 z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400'}`}>
                        {i+1}
                      </div>
                      <span className={`text-xl font-bold ${p.id === socket.id ? 'text-white' : 'text-slate-300'}`}>
                        {p.name}
                      </span>
                    </div>
                    <span className="font-mono text-xl font-bold text-slate-200 z-10">
                       {p.totalDuration ? (p.totalDuration / 1000).toFixed(2) + 's' : '-'}
                    </span>
                 </div>
               ))}
            </div>
            
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">
              Play Again
            </button>
          </div>
        )}

      </main>
    </div>
  )
}

export default App
