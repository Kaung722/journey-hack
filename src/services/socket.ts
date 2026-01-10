import { io } from 'socket.io-client';

// Connect to the backend server
// Ensure port matches your server/index.js (3000)
export const socket = io('http://localhost:3000');
