"use client";

import { useState } from 'react';
import { useSocket } from '@/context/SocketContext';

export default function SocketDebug() {
  const [expanded, setExpanded] = useState(false);
  const { isConnected, onlineUsers, connectionError, socket } = useSocket();

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 bg-gray-700 text-white p-2 rounded-lg text-xs z-50 opacity-70 hover:opacity-100"
      >
        Socket: {isConnected ? '🟢' : '🔴'}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-md text-xs font-mono">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Socket Debug</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          &times;
        </button>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <p>
          Status:{' '}
          <span
            className={`font-bold ${
              isConnected ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        
        {connectionError && (
          <p className="text-red-400">Error: {connectionError}</p>
        )}
        
        <p>Socket ID: {socket?.id || 'N/A'}</p>
        
        <div>
          <p className="mb-1">Online Users ({onlineUsers.length}):</p>
          {onlineUsers.length > 0 ? (
            <ul className="pl-4 space-y-1">
              {onlineUsers.map(userId => (
                <li key={userId} className="text-green-400">
                  {userId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 pl-4">No users online</p>
          )}
        </div>
      </div>
    </div>
  );
} 