import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { Message, ReadMessageEvent, TypingIndicatorEvent } from '@/types/socket';

let socket: Socket | null = null;
let isConnecting = false;
let connectionQueue: (() => void)[] = [];
let reconnectTimer: NodeJS.Timeout | null = null;

export const getAuthToken = (): string | null => {
  return Cookies.get('auth_token') || null;
};

export const getUserId = (): string | null => {
  return Cookies.get('user_id') || null;
};

export const initializeSocket = (userId?: string): Promise<Socket> => {
  if (socket?.connected) return Promise.resolve(socket);
  
  if (isConnecting) {
    return new Promise<Socket>(resolve => {
      connectionQueue.push(() => resolve(socket as Socket));
    });
  }
  
  isConnecting = true;
  console.log('Initializing socket connection...');
  console.log('User ID:', userId || getUserId());
  console.log('Auth token exists:', !!getAuthToken());
  
  // Clear any existing reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  return new Promise<Socket>((resolve, reject) => {
    const token = getAuthToken();
    const actualUserId = userId || getUserId();
    
    console.log('Socket connection attempt details:', {
      userId: actualUserId,
      hasToken: !!token,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      transportModes: ['websocket', 'polling']
    });
    
    // Try to get the stored socket and close it properly before creating a new one
    if (socket) {
      socket.disconnect();
      socket.close();
      socket = null;
    }
    
    // Create a new socket connection
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      query: actualUserId ? { userId: actualUserId } : undefined,
      auth: token ? { token } : undefined,
      // Try websocket first, then fallback to polling if needed
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 20000, // Increase timeout to 20 seconds
      withCredentials: true,
    });
    
    // Debug socket instance
    console.log('Socket instance created:', !!socket);
    
    // Safely log transport config without accessing protected properties
    try {
      // @ts-ignore - accessing internals for debugging
      console.log('Socket transport options:', socket.io.engine.opts?.transports || 'Not accessible');
    } catch (err) {
      console.log('Could not access socket transport details');
    }

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
      console.log('Socket connected successfully with ID:', socket?.id);
      clearTimeout(connectionTimeout);
      isConnecting = false;
      
      connectionQueue.forEach(cb => cb());
      connectionQueue = [];
      
      resolve(socket as Socket);
    });

    socket.on('reconnect', () => {
      console.log('Reconnected to server, fetching latest messages...');
      // Additional reconnection logic can be added here
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
      console.error('Socket connection error details:', {
        message: error.message,
        transport: socket?.io?.engine?.transport?.name,
        // Access additional properties safely
        ...(error as any)
      });
      clearTimeout(connectionTimeout);
      isConnecting = false;
      
      reject(error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
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

export const emitEvent = async <T>(eventName: string, data?: T): Promise<boolean> => {
  try {
    const socket = await getSocket();
    return new Promise((resolve) => {
      socket.emit(eventName, data, (response: { status: string; message: any }) => {
        if (response && response.status === 'ok') {
          resolve(true);
        } else {
          console.error(`Failed to emit ${eventName}:`, response?.message || 'Unknown error');
          resolve(false);
        }
      });
    });
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
    // Queue these listeners for when the socket connects
    connectionQueue.push(() => {
      if (socket) socket.on(eventName, callback);
    });
  }
};

export const removeListener = (eventName: string): void => {
  if (socket) {
    socket.off(eventName);
    console.log(`Removed listener for event: ${eventName}`);
  } else {
    console.warn(`Socket not available, couldn't remove listener for: ${eventName}`);
  }
};

// Message-specific helper methods
export const sendMessage = async (receiverId: string, text: string): Promise<boolean> => {
  console.log('Socket sendMessage called with:', { receiverId, text });
  try {
    // Use the correct event name that matches the backend
    // Default to 'send_message' but also try 'message' if that doesn't work
    let result = await emitEvent('message', { receiverId, text, image: null });
    if (!result) {
      // Try alternate event name as fallback
      result = await emitEvent('send_message', { receiverId, text });
    }
    console.log('Socket sendMessage result:', result);
    return result;
  } catch (error) {
    console.error('Socket sendMessage error:', error);
    return false;
  }
};

export const markMessageAsRead = async (messageId: string, senderId: string): Promise<boolean> => {
  return emitEvent<ReadMessageEvent>('read_message', { messageId, senderId });
};

export const sendTypingIndicator = async (conversationId: string, receiverId: string): Promise<boolean> => {
  return emitEvent<TypingIndicatorEvent>('typing', { conversationId, receiverId });
};

/**
 * Checks if the backend server is reachable
 * @returns Promise<boolean> True if the server is reachable
 */
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('Checking server connection at:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/health`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};

/**
 * Pre-flight check to test connectivity before socket initialization
 * Tests basic HTTP connection and CORS setup
 */
export const testServerConnectivity = async (): Promise<{success: boolean, message: string}> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('Running server connectivity test to:', apiUrl);
    
    // Test simple HTTP GET
    const httpResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }).catch(err => {
      console.error('HTTP connection test failed:', err);
      return null;
    });
    
    if (!httpResponse) {
      return {
        success: false,
        message: 'Cannot reach server via HTTP. Check if server is running and the URL is correct.'
      };
    }

    if (httpResponse.status === 404) {
      console.log('Health endpoint not found, but server is reachable');
      return { success: true, message: 'Server is reachable but /health endpoint not found' };
    }
    
    console.log('HTTP connection test successful:', httpResponse.status);
    return { success: true, message: 'Server is reachable via HTTP' };
  } catch (error) {
    return {
      success: false,
      message: `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}; 