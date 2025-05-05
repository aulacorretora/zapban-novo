import { io } from 'socket.io-client';
import { toast } from '../components/ui/use-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10, // Aumentar para 10 tentativas
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000, // Adicionar delay máximo
  timeout: 20000, // Aumentar timeout
});

let isToastShown = false;

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  
  if (isToastShown) {
    toast({
      title: "Conexão restabelecida",
      description: "A conexão com o servidor foi restabelecida com sucesso.",
      variant: "default",
    });
    isToastShown = false;
  }
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error: Error) => {
  console.error('Socket connection error:', error);
  
  if (!isToastShown) {
    toast({
      variant: "destructive",
      title: "Erro de conexão",
      description: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    });
    isToastShown = true;
  }
});

export const reconnectSocket = () => {
  console.log('Attempting manual reconnection...');
  socket.connect();
};

export const isSocketConnected = () => {
  return socket.connected;
};
