"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { 
  getFriendsList, 
  getFriendRequestsList, 
  sendFriendRequest as sendFriendRequestToUser, 
  acceptFriendRequest as acceptFriendRequestById,
  rejectFriendRequest as rejectFriendRequestById,
  removeFriend as removeFriendById,
  searchForUsers
} from '@/api';
import { IUser, IFriendRequest } from '@/types/index';

interface FriendUser extends IUser {}

interface IncomingRequest extends IFriendRequest {
  sender: IUser;
}

interface OutgoingRequest extends IFriendRequest {
  receiver: IUser;
}

interface RequestsData {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
}

export default function Friends() {
  const { user: currentUser, loading } = useAuth();
  const searchParams = useSearchParams();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<RequestsData>({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState({
    friends: false,
    requests: false,
    search: false
  });
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    // Get tab from URL if present
    const tabParam = searchParams.get('tab');
    if (tabParam && ['friends', 'requests', 'search'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
 
  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadRequests();
    }
  }, [currentUser]);
 
  const loadFriends = async () => {
    try {
      setIsLoading(prev => ({ ...prev, friends: true }));
      const response = await getFriendsList();
      if (response.success && Array.isArray(response.data)) {
        setFriends(response.data.filter(friend => friend && friend._id));
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    } finally {
      setIsLoading(prev => ({ ...prev, friends: false }));
    }
  };

  const loadRequests = async () => {
    try {
      setIsLoading(prev => ({ ...prev, requests: true }));
      const response = await getFriendRequestsList();
      if (response.success && response.data) {
        const validIncoming = response.data.incoming.filter(req => req && req.sender && req.sender._id);
        const validOutgoing = response.data.outgoing.filter(req => req && req.receiver && req.receiver._id);
        setRequests({ 
          incoming: validIncoming, 
          outgoing: validOutgoing 
        });
      } else {
        setRequests({ incoming: [], outgoing: [] });
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setRequests({ incoming: [], outgoing: [] });
    } finally {
      setIsLoading(prev => ({ ...prev, requests: false }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(prev => ({ ...prev, search: true }));
      console.log('Searching for:', searchQuery);
      const response = await searchForUsers(searchQuery);
      console.log('Search response:', response);
      
      // Handle different response formats and ensure valid data
      if (Array.isArray(response)) {
        const validResults = response.filter(user => user && user._id);
        setSearchResults(validResults);
      } else if (response.success && Array.isArray(response.data)) {
        const validResults = response.data.filter(user => user && user._id);
        setSearchResults(validResults);
      } else {
        console.error('Search API returned unexpected format:', response);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(prev => ({ ...prev, search: false }));
    }
  };

  const sendRequest = async (userId: string) => {
    if (!userId) {
      console.error('Invalid user ID for friend request');
      return;
    }

    try {
      console.log('Sending friend request to user ID:', userId);
      const response = await sendFriendRequestToUser(userId);
      console.log('Friend request response:', response);
      
      if (response.success) {
        console.log('Friend request sent successfully');
        await loadRequests();
      } else {
        console.error('Failed to send friend request:', response.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!requestId) {
      console.error('Invalid request ID for accepting');
      return;
    }

    try {
      await acceptFriendRequestById(requestId);
      await loadRequests();
      await loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!requestId) {
      console.error('Invalid request ID for rejecting');
      return;
    }

    try {
      await rejectFriendRequestById(requestId);
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!friendId) {
      console.error('Invalid friend ID for removal');
      return;
    }

    try {
      await removeFriendById(friendId);
      await loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto p-4 text-center flex-grow flex items-center justify-center">
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto p-4 flex-grow">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>
        
        <div className="mb-6">
          <div className="flex border-b">
            <button 
              className={`px-4 py-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              My Friends
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Friend Requests
              {requests.incoming.length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {requests.incoming.length}
                </span>
              )}
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'search' ? 'border-b-2 border-blue-500 text-blue-500' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Find Friends
            </button>
          </div>
        </div>

        {activeTab === 'search' && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="flex-grow p-2 border rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading.search}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isLoading.search ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((user) => {
                  if (!user || !user._id) return null;
                  
                  const isCurrentUser = user._id === currentUser._id;
                  const isFriend = friends.some(friend => friend._id === user._id);
                  const hasPendingOutgoing = requests.outgoing.some(req => req.receiver._id === user._id);
                  const hasPendingIncoming = requests.incoming.some(req => req.sender._id === user._id);

                  return (
                    <li key={user._id} className="border p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.displayName || 'User'} 
                            className="w-12 h-12 rounded-full mr-3" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-xl text-gray-500">{user.displayName?.[0] || '?'}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{user.displayName || 'User'}</p>
                          {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <div>
                          {isFriend ? (
                            <button
                              onClick={() => removeFriend(user._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove Friend
                            </button>
                          ) : hasPendingOutgoing ? (
                            <span className="text-gray-500">Request Sent</span>
                          ) : hasPendingIncoming ? (
                            <span className="text-blue-500">Respond to Request</span>
                          ) : (
                            <button
                              onClick={() => sendRequest(user._id)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Add Friend
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        
        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl mb-4">My Friends</h2>
            {isLoading.friends ? (
              <p>Loading friends...</p>
            ) : friends.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => {
                  if (!friend || !friend._id) return null;
                  
                  return (
                    <li key={friend._id} className="border p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        {friend.profilePicture ? (
                          <img 
                            src={friend.profilePicture} 
                            alt={friend.displayName || 'User'} 
                            className="w-12 h-12 rounded-full mr-3" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-xl text-gray-500">{friend.displayName?.[0] || '?'}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{friend.displayName || 'User'}</p>
                          {friend.username && <p className="text-sm text-gray-500">@{friend.username}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFriend(friend._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>You don't have any friends yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div>
            {requests.incoming.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Incoming Requests</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.incoming.map((request) => {
                    if (!request || !request.sender || !request.sender._id) return null;
                    
                    return (
                      <li key={request._id} className="border p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          {request.sender.profilePicture ? (
                            <img 
                              src={request.sender.profilePicture} 
                              alt={request.sender.displayName || 'User'} 
                              className="w-12 h-12 rounded-full mr-3" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{request.sender.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{request.sender.displayName || 'User'}</p>
                            {request.sender.username && (
                              <p className="text-sm text-gray-500">@{request.sender.username}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptRequest(request._id)}
                            className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectRequest(request._id)}
                            className="flex-1 bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {requests.outgoing.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Sent Requests</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.outgoing.map((request) => {
                    if (!request || !request.receiver || !request.receiver._id) return null;
                    
                    return (
                      <li key={request._id} className="border p-4 rounded-lg">
                        <div className="flex items-center">
                          {request.receiver.profilePicture ? (
                            <img 
                              src={request.receiver.profilePicture} 
                              alt={request.receiver.displayName || 'User'} 
                              className="w-12 h-12 rounded-full mr-3" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{request.receiver.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{request.receiver.displayName || 'User'}</p>
                            {request.receiver.username && (
                              <p className="text-sm text-gray-500">@{request.receiver.username}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Request pending...</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {requests.incoming.length === 0 && requests.outgoing.length === 0 && (
              <p>No friend requests.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 