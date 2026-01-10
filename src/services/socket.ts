import { io } from 'socket.io-client';

// Connect to the backend server
// Ensure port matches your server/index.js (3000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const socket = io(API_URL);
