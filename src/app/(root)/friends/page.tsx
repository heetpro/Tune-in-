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
import { getUserProfile } from '@/api/user';
import { IUser, IFriendRequest } from '@/types/index';
import Navbar from '@/components/Navbar';

interface FriendUser extends IUser {}

// Updated interfaces to match backend response
interface IncomingRequest {
  _id: string;
  senderId: {
    _id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    username?: string;
    bio?: string;  // Added bio field
  };
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

interface OutgoingRequest {
  _id: string;
  senderId: string;
  receiverId: {
    _id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    username?: string;
    bio?: string;  // Added bio field
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

interface RequestsData {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
}

interface DetailedProfileMap {
  [key: string]: IUser;
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
  const [detailedProfiles, setDetailedProfiles] = useState<DetailedProfileMap>({});

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
 
  // Fetch detailed profile for a user
  const fetchDetailedProfile = async (userId: string) => {
    if (!userId) return null;
    
    // Return from cache if we've already fetched this profile
    if (detailedProfiles[userId]) {
      return detailedProfiles[userId];
    }
    
    try {
      const response = await getUserProfile(userId);

      if (response.success && response.data) {
        
        // FIX: Store the profile data in the map using the user's ID as the key
        setDetailedProfiles(prev => ({
          ...prev,
          [userId]: response.data as IUser
        }));
        
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching detailed profile for ${userId}:`, error);
    }
    return null;
  };
  
  const loadFriends = async () => {
    try {
      setIsLoading(prev => ({ ...prev, friends: true }));
      const response = await getFriendsList();
      if (response.success && Array.isArray(response.data)) {
        const basicFriends = response.data.filter(friend => friend && friend._id);
        setFriends(basicFriends);
        
        basicFriends.forEach(friend => {
          fetchDetailedProfile(friend._id);
        });
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
      
      if (response.data) {
        setRequests({
          incoming: response.data.incoming || [],
          outgoing: response.data.outgoing || []
        });
        
        // Process incoming requests to fetch sender profiles
        await Promise.all(response.data.incoming.map(async request => {
          // Extract the sender ID - handle both string and object cases
          let senderIdValue: string;
          
          if (typeof request.senderId === 'object' && request.senderId !== null && request.senderId._id) {
            senderIdValue = request.senderId._id;
          } else if (typeof request.senderId === 'string') {
            senderIdValue = request.senderId;
          } else {
            return; // Skip if no valid ID
          }
          
          if (senderIdValue) {
            await fetchDetailedProfile(senderIdValue);
          }
        }));
        
        // Process outgoing requests to fetch receiver profiles
        await Promise.all(response.data.outgoing.map(async request => {
          // Extract the receiver ID - handle both string and object cases
          let receiverIdValue: string;
          
          if (typeof request.receiverId === 'object' && request.receiverId !== null && request.receiverId._id) {
            receiverIdValue = request.receiverId._id;
          } else if (typeof request.receiverId === 'string') {
            receiverIdValue = request.receiverId;
          } else {
            return; // Skip if no valid ID
          }
          
          if (receiverIdValue) {
            console.log(`Fetching profile for receiver ID: ${receiverIdValue}`);
            await fetchDetailedProfile(receiverIdValue);
          }
        }));
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
      const response = await searchForUsers(searchQuery);
      
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
      const response = await sendFriendRequestToUser(userId);
      
      if (response.success) {
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

  useEffect(() => {
    
    // Log info about outgoing requests
    if (requests.outgoing && requests.outgoing.length > 0) {
      console.log("Outgoing requests data:", requests.outgoing);
      requests.outgoing.forEach((request, i) => {
        if (typeof request.receiverId === 'object' && request.receiverId?._id) {
          const userId = request.receiverId._id;
          console.log(`Has profile for ${userId}:`, !!detailedProfiles[userId], detailedProfiles[userId]);
        }
      });
    }
  }, [requests.outgoing, detailedProfiles]);

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
                  const hasPendingOutgoing = requests.outgoing.some(req => req.receiverId?._id === user._id);
                  const hasPendingIncoming = requests.incoming.some(req => req.senderId?._id === user._id);

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
                  
                  // Get detailed profile if available
                  const detailedFriend = detailedProfiles[friend._id] || friend;
                  
                  return (
                    <li key={friend._id} className="border p-4 rounded-lg flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {detailedFriend.profilePicture ? (
                            <img 
                              src={detailedFriend.profilePicture} 
                              alt={detailedFriend.displayName || 'User'} 
                              className="w-12 h-12 rounded-full mr-3 object-cover" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{detailedFriend.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{detailedFriend.displayName || 'User'}</p>
                            {detailedFriend.username && <p className="text-sm text-gray-500">@{detailedFriend.username}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFriend(friend._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Bio section */}
                      {detailedFriend.bio && (
                        <div className="mt-1 mb-2">
                          <p className="text-sm text-gray-600 line-clamp-2">{detailedFriend.bio}</p>
                        </div>
                      )}
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
                    if (!request || !request._id) return null;
                    
                    // Extract the sender information
                    let senderId: string;
                    let senderData: any = null;
                    
                    // If senderId is an object with _id
                    if (typeof request.senderId === 'object' && request.senderId?._id) {
                      senderId = request.senderId._id;
                      // Use basic data from the senderId object as fallback
                      senderData = request.senderId;
                    } 
                    // If senderId is a string
                    else if (typeof request.senderId === 'string') {
                      senderId = request.senderId;
                    }
                    else {
                      return null; // Can't process without sender ID
                    }
                    
                    // Check if we have detailed profile data
                    const detailedUser = senderId ? detailedProfiles[senderId] : null;
                    
                    // Use detailed data if available, otherwise use basic data
                    const userData = detailedUser || senderData || { displayName: 'User' };
                    
                    (`Rendering request ${request._id} for sender ${senderId}`, {
                      hasDetailedData: !!detailedUser,
                      userData
                    });
                    
                    return (
                      <li key={request._id} className="border p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          {userData.profilePicture ? (
                            <img 
                              src={userData.profilePicture} 
                              alt={userData.displayName || 'User'} 
                              className="w-12 h-12 rounded-full mr-3 object-cover" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{userData.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{userData.displayName || 'User'}</p>
                            {userData.username && (
                              <p className="text-sm text-gray-500">@{userData.username}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Bio section */}
                        {userData.bio && (
                          <div className="mt-2 mb-3">
                            <p className="text-sm text-gray-600 line-clamp-2">{userData.bio}</p>
                          </div>
                        )}
                        
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
                    if (!request || !request._id) return null;
                    
                    // Extract the receiver information
                    let receiverId: string;
                    let receiverData: any = null;
                    
                    // If receiverId is an object with _id
                    if (typeof request.receiverId === 'object' && request.receiverId?._id) {
                      receiverId = request.receiverId._id;
                      // Use basic data from the receiverId object as fallback
                      receiverData = request.receiverId;
                    } 
                    // If receiverId is a string
                    else if (typeof request.receiverId === 'string') {
                      receiverId = request.receiverId;
                    }
                    else {
                      return null; // Can't process without receiver ID
                    }
                    
                    // Check if we have detailed profile data
                    const detailedUser = receiverId ? detailedProfiles[receiverId] : null;
                    
                    // Use detailed data if available, otherwise use basic data
                    const userData = detailedUser || receiverData || { displayName: 'User' };
                    
                    console.log(`Rendering request ${request._id} for receiver ${receiverId}`, {
                      hasDetailedData: !!detailedUser,
                      userData
                    });
                    
                    return (
                      <li key={request._id} className="border p-4 rounded-lg">
                        <div className="flex items-center">
                          {userData.profilePicture ? (
                            <img 
                              src={userData.profilePicture} 
                              alt={userData.displayName || 'User'} 
                              className="w-12 h-12 rounded-full mr-3 object-cover" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                              <span className="text-xl text-gray-500">{userData.displayName?.[0] || '?'}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{userData.displayName || 'User'}</p>
                            {userData.username && (
                              <p className="text-sm text-gray-500">@{userData.username}</p>
                            )}
                          </div>
                        </div>

                        {/* Bio section */}
                        {userData.bio && (
                          <div className="mt-2 mb-2">
                            <p className="text-sm text-gray-600 line-clamp-2">{userData.bio}</p>
                          </div>
                        )}
                        
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