"use client";

import React, { useState } from 'react';
import { testServerConnectivity } from '@/lib/socket';
import { useChat } from '@/context/ChatContext';

const SocketDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { isConnected, connectionError } = useChat();

  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testServerConnectivity();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`Error running test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 mb-4 mr-4 bg-white shadow-lg rounded-lg p-3 text-sm max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span>Socket: {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-500 hover:underline text-xs"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-2">
          {connectionError && (
            <div className="text-red-500 mb-2">
              <div className="font-bold">Error:</div>
              <div className="text-xs">{connectionError}</div>
            </div>
          )}
          
          <div className="flex space-x-2 mt-2">
            <button
              onClick={runConnectionTest}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          
          {testResult && (
            <div className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
          
          <div className="mt-2">
            <details className="text-xs">
              <summary className="cursor-pointer hover:text-blue-500">
                Troubleshooting Tips
              </summary>
              <ul className="pl-5 mt-1 list-disc space-y-1">
                <li>Check if backend server is running at the correct URL</li>
                <li>Verify NEXT_PUBLIC_API_URL is set correctly in .env</li>
                <li>Check CORS settings on your backend server</li>
                <li>Ensure user ID and authentication token are valid</li>
                <li>Try using different transport (websocket/polling)</li>
              </ul>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocketDebug; 