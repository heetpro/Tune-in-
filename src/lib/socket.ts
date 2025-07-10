import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket: Socket | null = null;

export const initializeSocket = (userId: string): Socket => {
  if (!socket) {
    const token = Cookies.get('auth_token') as string;
    
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: { userId },
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitEvent = <T>(eventName: string, data?: T): void => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.error('Socket not connected, cannot emit event:', eventName);
  }
};

export const listenEvent = <T>(eventName: string, callback: (data: T) => void): void => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

export const removeListener = (eventName: string): void => {
  if (socket) {
    socket.off(eventName);
  }
}; 