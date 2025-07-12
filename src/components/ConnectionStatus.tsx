import React from 'react';
import { useChat } from '@/context/ChatContext';

const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionError } = useChat();
  
  // Don't show anything if connected
  if (isConnected) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center text-sm z-50 shadow-md">
      {connectionError 
        ? `Connection Error: ${connectionError}` 
        : 'Disconnected from chat server. Reconnecting...'}
    </div>
  );
};

export default ConnectionStatus; 