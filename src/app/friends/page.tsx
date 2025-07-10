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
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, friends: false }));
    }
  };

  const loadRequests = async () => {
    try {
      setIsLoading(prev => ({ ...prev, requests: true }));
      const response = await getFriendRequestsList();
      setRequests(response.data || { incoming: [], outgoing: [] });
    } catch (error) {
      console.error('Error loading friend requests:', error);
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
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log('Setting direct array search results:', response);
        setSearchResults(response);
      } else if (response.success && response.data) {
        console.log('Setting search results from standard response:', response.data);
        setSearchResults(response.data);
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
    try {
      console.log('Sending friend request to user ID:', userId);
      const response = await sendFriendRequestToUser(userId);
      console.log('Friend request response:', response);
      
      if (response.success) {
        console.log('Friend request sent successfully');
        // Update outgoing requests list
        await loadRequests();
        // Don't clear search results or query after sending request
        // This allows users to continue sending requests to other users
      } else {
        console.error('Failed to send friend request:', response.message || 'Unknown error');
        // Show error notification here if you have a notification system
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      // Show error notification here if you have a notification system
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequestById(requestId);
      await loadRequests();
      await loadFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequestById(requestId);
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
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
      <Header />
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
        
        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl mb-4">My Friends</h2>
            {isLoading.friends ? (
              <p>Loading friends...</p>
            ) : friends.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <li key={friend._id} className="border p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      {friend.profilePicture && (
                        <img 
                          src={friend.profilePicture} 
                          alt={friend.displayName} 
                          className="w-12 h-12 rounded-full mr-3" 
                        />
                      )}
                      <div>
                        <p className="font-medium">{friend.displayName}</p>
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
                ))}
              </ul>
            ) : (
              <p>You don't have any friends yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div>
            <div className="mb-8">
              <h2 className="text-xl mb-4">Incoming Requests</h2>
              {isLoading.requests ? (
                <p>Loading requests...</p>
              ) : requests.incoming.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.incoming.map((request) => (
                    <li key={request._id} className="border p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        {request.sender.profilePicture && (
                          <img 
                            src={request.sender.profilePicture} 
                            alt={request.sender.displayName} 
                            className="w-12 h-12 rounded-full mr-3" 
                          />
                        )}
                        <div>
                          <p className="font-medium">{request.sender.displayName}</p>
                          {request.sender.username && <p className="text-sm text-gray-500">@{request.sender.username}</p>}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => acceptRequest(request._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(request._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No incoming friend requests.</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl mb-4">Outgoing Requests</h2>
              {isLoading.requests ? (
                <p>Loading requests...</p>
              ) : requests.outgoing.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.outgoing.map((request) => (
                    <li key={request._id} className="border p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        {request.receiver.profilePicture && (
                          <img 
                            src={request.receiver.profilePicture} 
                            alt={request.receiver.displayName} 
                            className="w-12 h-12 rounded-full mr-3" 
                          />
                        )}
                        <div>
                          <p className="font-medium">{request.receiver.displayName}</p>
                          {request.receiver.username && <p className="text-sm text-gray-500">@{request.receiver.username}</p>}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">Pending</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No outgoing friend requests.</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div>
            <h2 className="text-xl mb-4">Find Friends</h2>
            <div className="flex mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username"
                className="flex-grow p-2 border rounded-l"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600"
                disabled={isLoading.search}
              >
                {isLoading.search ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {isLoading.search ? (
              <p>Searching users...</p>
            ) : searchResults.length > 0 ? (
              <div>
                <h3 className="text-lg mb-2">Search Results</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((user) => {
                    // Check if the user is already a friend or has a pending request
                    const isFriend = friends.some(friend => friend._id === user._id);
                    const isRequested = requests.outgoing.some(req => req.receiver._id === user._id);
                    const isRequesting = requests.incoming.some(req => req.sender._id === user._id);
                    const isCurrentUser = user?._id === currentUser?._id;
                    
                    return (
                      <li key={user._id} className="border p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          {user.profilePicture ? (
                            <img 
                              src={user.profilePicture} 
                              alt={user.displayName} 
                              className="w-12 h-12 rounded-full mr-3" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{user.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.displayName}</p>
                            {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <button
                            onClick={() => sendRequest(user._id)}
                            className={`px-3 py-1 rounded ${
                              isFriend || isRequested || isRequesting
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                            disabled={isFriend || isRequested || isRequesting || isCurrentUser}
                          >
                            {isFriend 
                              ? 'Friends' 
                              : isRequested 
                                ? 'Request Sent' 
                                : isRequesting 
                                  ? 'Requesting You' 
                                  : 'Add Friend'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : searchQuery && !isLoading.search ? (
              <p>No users found matching "{searchQuery}"</p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
} 