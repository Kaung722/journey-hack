const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow Vite frontend
    methods: ["GET", "POST"]
  }
});

// Store all active rooms
// Room Structure:
// {
//    id: string,
//    players: [ { id: string, name: string, finishTime: number | null } ],
//    status: 'lobby' | 'racing' | 'waiting' | 'scoreboard',
//    round: 1
// }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        status: 'lobby',
        round: 1
      };
      rooms.set(roomId, room);
    }

    // Add player if not already in
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (!existingPlayer) {
      const isFirstPlayer = room.players.length === 0;
      room.players.push({
        id: socket.id,
        name: username || `Player ${room.players.length + 1}`,
        finishTime: null,
        roundDuration: null,
        totalDuration: 0,
        isHost: isFirstPlayer
      });
    }

    // Broadcast updated room state
    io.to(roomId).emit('room_update', room);
    console.log(`User ${username} joined room ${roomId}`);
  });

  socket.on('start_game', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.status = 'racing';
      room.round = 1;
      // Reset times
      room.players.forEach(p => {
        p.finishTime = null;
        p.roundDuration = null;
        p.totalDuration = 0; // Reset total for new game
      });
      
      io.to(roomId).emit('global_start_round', { round: 1 });
      io.to(roomId).emit('room_update', room);
      console.log(`Game started in room ${roomId}`);
    }
  });

  socket.on('submit_result', ({ roomId, duration }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.finishTime = Date.now(); // Just to mark as done
      player.roundDuration = duration;
      player.totalDuration += duration;
    }

    // Check for round completion
    checkRoundCompletion(room, roomId);
    
    // If not finished, we are waiting
    if (room.status === 'racing') {
        // Optimistic update for the one who finished
         // Actually, checkRoundCompletion handles updates if everyone finished.
         // If NOT everyone finished, we need to tell this user (and others) that *this* user is waiting.
         // Typically the client handles 'waiting' state based on finishTime > null.
         // We should update the room status to 'waiting' if *at least one* person finished? 
         // NO. 'waiting' status blindly forces everyone to wait screen (old bug).
         // We keep status 'racing'. Individual clients see they are waiting.
         
         // But we MUST emit room_update so clients know this player finished.
         // checkRoundCompletion only emits if !allFinished?
         // Let's check the helper I wrote above.
         // It emits room_update in the !allFinished block.
    }
  });

  socket.on('next_round', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.round += 1;
      room.status = 'racing';
      room.players.forEach(p => p.finishTime = null);

      if (room.round > 3) {
         // Loop back or End Game? Let's just keep going for now or reset
         // Implementation plan says 3 rounds.
         // Maybe emit 'game_over' if round > 3
      }

      io.to(roomId).emit('global_start_round', { round: room.round });
      io.to(roomId).emit('room_update', room);
    }
  });

// Helper to check round completion and advance state
const checkRoundCompletion = (room, roomId) => {
    const allFinished = room.players.every(p => p.finishTime !== null);
    if (!allFinished) {
        if (room.status === 'racing' || room.status === 'waiting') {
           // If we are waiting, ensure we stay waiting or go back to racing? 
           // actually if someone left, we might still be waiting for others.
           // no state change needed unless allFinished.
           io.to(roomId).emit('room_update', room);
        }
        return;
    }

    // All finished!
    // Sort players by round duration for intermediate scoreboard
    const rankings = [...room.players].sort((a, b) => a.roundDuration - b.roundDuration);

    if (room.round < 3) {
      // Intermediate Round
      room.status = 'scoreboard';
      io.to(roomId).emit('round_finished', { rankings });
      io.to(roomId).emit('room_update', room);
      console.log(`Round ${room.round} finished in room ${roomId}. Starting 15s timer.`);

      // Auto-start next round after 15 seconds
      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom || currentRoom.status === 'racing') return;
        
        currentRoom.round += 1;
        currentRoom.status = 'racing';
        currentRoom.players.forEach(p => {
           p.finishTime = null;
           p.roundDuration = null;
        });
        
        io.to(roomId).emit('global_start_round', { round: currentRoom.round });
        io.to(roomId).emit('room_update', currentRoom);
        console.log(`Auto-starting Round ${currentRoom.round} in room ${roomId}`);
      }, 15000);

    } else {
       // Final Round - Game Over Immediately
       room.status = 'victory';
       // Sort by TOTAL duration
       const finalRankings = [...room.players].sort((a, b) => a.totalDuration - b.totalDuration);
       
       io.to(roomId).emit('game_over', { rankings: finalRankings });
       io.to(roomId).emit('room_update', room);
       console.log(`Game Over in room ${roomId}`);
    }
};

  socket.on('disconnect', () => {
    console.log("User Disconnected", socket.id);
    // Remove player from rooms (Basic cleanup)
    rooms.forEach((room, roomId) => {
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        const player = room.players[index];
        room.players.splice(index, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          // Host Migration
          if (player.isHost) {
             room.players[0].isHost = true;
             console.log(`Host migrated to ${room.players[0].name} in room ${roomId}`);
          }
          
          // Check if round should end (if we were the last one holding it up)
          if (room.status === 'racing' || room.status === 'waiting') {
             checkRoundCompletion(room, roomId);
          } else {
             io.to(roomId).emit('room_update', room);
          }
        }
      }
    });
  });
});

server.listen(3000, () => {
  console.log('SERVER RUNNING ON PORT 3000');
});
