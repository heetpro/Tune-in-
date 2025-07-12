import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let socket: Socket | null = null;
let isConnecting = false;
let connectionQueue: (() => void)[] = [];
let reconnectTimer: NodeJS.Timeout | null = null;

export const initializeSocket = (userId?: string): Promise<Socket> => {
  if (socket?.connected) return Promise.resolve(socket);
  
  if (isConnecting) {
    return new Promise<Socket>(resolve => {
      connectionQueue.push(() => resolve(socket as Socket));
    });
  }
  
  isConnecting = true;
  
  // Clear any existing reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  return new Promise<Socket>((resolve, reject) => {
    const token = Cookies.get('auth_token');
    
    // Try to get the stored socket and close it properly before creating a new one
    if (socket) {
      socket.disconnect();
      socket.close();
      socket = null;
    }
    
    // Create a new socket connection
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      query: userId ? { userId } : undefined,
      auth: token ? { token } : undefined,
      // Try polling first, then upgrade to websocket - helps with some connectivity issues
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 20000, // Increase timeout to 20 seconds
      withCredentials: true,
    });

    // Set up a timeout for the initial connection
    const connectionTimeout = setTimeout(() => {
      if (!socket?.connected) {
        console.warn('Socket connection timed out, falling back to HTTP mode');
        isConnecting = false;
        
        // Resolve with null to indicate fallback to HTTP
        reject(new Error('Socket connection timed out'));
      }
    }, 10000); // 10 second timeout for initial connection

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      clearTimeout(connectionTimeout);
      isConnecting = false;
      
      connectionQueue.forEach(cb => cb());
      connectionQueue = [];
      
      resolve(socket as Socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      // If server disconnected us, try reconnecting after a delay
      if (reason === 'io server disconnect') {
        reconnectTimer = setTimeout(() => {
          initializeSocket(userId);
        }, 5000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      clearTimeout(connectionTimeout);
      isConnecting = false;
      
      reject(error);
    });
  });
};

export const getSocket = async (): Promise<Socket> => {
  if (!socket || !socket.connected) {
    return initializeSocket();
  }
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Enhanced emit event with acknowledgment support
export const emitEvent = async <T, R = any>(
  eventName: string, 
  data?: T, 
  withAck: boolean = false
): Promise<R | boolean> => {
  try {
    const socket = await getSocket();
    
    if (withAck) {
      return new Promise((resolve) => {
        socket.emit(eventName, data, (response: R) => {
          resolve(response);
        });
      });
    } else {
      socket.emit(eventName, data);
      return true;
    }
  } catch (error) {
    console.error(`Socket not connected, cannot emit event: ${eventName}`, error);
    return false;
  }
};

export const listenEvent = <T>(eventName: string, callback: (data: T) => void): void => {
  if (socket) {
    socket.on(eventName, callback);
  } else {
    console.warn(`Socket not initialized, can't set listener for: ${eventName}`);
    // We could queue these too, but for now just warn
  }
};

export const removeListener = (eventName: string): void => {
  if (socket) {
    socket.off(eventName);
  }
};

// Save messages to local storage
export const saveMessagesToStorage = (userId: string, messages: Record<string, any[]>) => {
  try {
    localStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to storage:', error);
  }
};

// Load messages from local storage
export const loadMessagesFromStorage = (userId: string): Record<string, any[]> => {
  try {
    const stored = localStorage.getItem(`chat_messages_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach(conversationId => {
        parsed[conversationId] = parsed[conversationId].map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }));
      });
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading messages from storage:', error);
  }
  return {};
};

// Sound notification for new messages
export const playMessageSound = () => {
  try {
    const audio = new Audio('/notification.mp3'); // You'll need to add this file to your public folder
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  } catch (error) {
    console.error('Error with audio playback:', error);
  }
};