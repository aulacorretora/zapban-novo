import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

export const joinInstance = (instanceId) => {
  if (socket && instanceId) {
    socket.emit('join_instance', instanceId);
    console.log(`Joined instance: ${instanceId}`);
  }
};

export const joinChat = (instanceId, chatId) => {
  if (socket && instanceId && chatId) {
    socket.emit('join_chat', { instanceId, chatId });
    console.log(`Joined chat: ${instanceId}/${chatId}`);
  }
};

export default socket;
