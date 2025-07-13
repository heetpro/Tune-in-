"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!user?._id) {
      console.log('Not initializing socket - no user ID available');
      return;
    }

    const userId = user._id;
    const token = Cookies.get('auth_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    console.log('Connecting to Socket.IO server at:', apiUrl);
    console.log('With user ID:', userId);
    
    const newSocket = io(apiUrl, {
      query: { userId },
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    // Online users management
    newSocket.on('getOnlineUsers', (users) => {
      console.log('Online users updated:', users);
      setOnlineUsers(users);
    });

    newSocket.on('user_status_changed', (data) => {
      console.log('User status changed:', data);
      setOnlineUsers(prev => {
        if (data.status === 'online' && !prev.includes(data.userId)) {
          return [...prev, data.userId];
        } else if (data.status === 'offline') {
          return prev.filter(id => id !== data.userId);
        }
        return prev;
      });
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user?._id]); // Only re-run if userId changes

  const value = {
    socket,
    onlineUsers,
    isConnected,
    connectionError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 