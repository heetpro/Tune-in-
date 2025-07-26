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
import { API_BASE_URL, getHeaders } from '@/api/config';
import { ProfileModal } from '@/components/ProfileModal';

interface FriendUser extends IUser {}

// Updated interfaces to match backend response
interface IncomingRequest {
  _id?: string;  // Original ID field
  requestId?: string;  // Our generated ID for new format
  senderId: {
    _id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    username?: string;
    bio?: string;  // Added bio field
  } | string;
  receiverId?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  respondedAt?: string;
}

interface OutgoingRequest {
  _id?: string;  // Original ID field
  requestId?: string;  // Our generated ID for new format
  senderId?: string;
  receiverId: {
    _id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    username?: string;
    bio?: string;  // Added bio field
  } | string;
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
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

  const [selectedUser, setSelectedUser] = useState<IUser>()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

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
      
      console.log('Current user structure:', {
        hasFriends: !!currentUser.friends?.id,
        friendsCount: currentUser.friends?.id?.length || 0,
        hasIncomingRequests: !!currentUser.friendRequests?.incoming?.id,
        incomingCount: currentUser.friendRequests?.incoming?.id?.length || 0,
        hasOutgoingRequests: !!currentUser.friendRequests?.outgoing?.id,
        outgoingCount: currentUser.friendRequests?.outgoing?.id?.length || 0
      });
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
      } else if (currentUser?.friends?.id && Array.isArray(currentUser.friends.id)) {
        // Handle new schema where friend IDs are stored directly in user object
        const friendIds = currentUser.friends.id;
        // Fetch detailed profiles for each friend ID
        const friendPromises = friendIds.map(id => fetchDetailedProfile(id));
        const friendDetails = await Promise.all(friendPromises);
        const validFriends = friendDetails.filter(friend => friend !== null) as IUser[];
        setFriends(validFriends);
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
        const incomingRequests = response.data.incoming || [];
        const outgoingRequests = response.data.outgoing || [];
        
        let processedIncoming: any[] = [];
        let processedOutgoing: any[] = [];
        
        if (Array.isArray(incomingRequests)) {
          if (incomingRequests.length > 0) {
            if (typeof incomingRequests[0] === 'string') {
              processedIncoming = await Promise.all((incomingRequests as string[]).map(async userId => {
                const profile = await fetchDetailedProfile(userId);
                if (profile) {
                  return {
                    requestId: `incoming-${userId}`, 
                    senderId: { 
                      ...profile,
                      _id: userId
                    }
                  };
                }
                return null;
              }));
              processedIncoming = processedIncoming.filter(req => req !== null);
            } else {
              // Old format - objects with sender/receiver
              processedIncoming = incomingRequests as any[];
              
              // Still fetch detailed profiles for old format
              await Promise.all((incomingRequests as any[]).map(async (request: any) => {
                let senderIdValue: string | undefined;
                
                if (typeof request.senderId === 'object' && request.senderId !== null && request.senderId._id) {
                  senderIdValue = request.senderId._id;
                } else if (typeof request.senderId === 'string') {
                  senderIdValue = request.senderId;
                }
                
                if (senderIdValue) {
                  await fetchDetailedProfile(senderIdValue);
                }
              }));
            }
          }
        }
        
        // Process outgoing requests
        if (Array.isArray(outgoingRequests)) {
          if (outgoingRequests.length > 0) {
            // Check if we have new format (string IDs) or old format (objects)
            if (typeof outgoingRequests[0] === 'string') {
              // New format - array of user IDs
              processedOutgoing = await Promise.all((outgoingRequests as string[]).map(async userId => {
                const profile = await fetchDetailedProfile(userId);
                if (profile) {
                  return {
                    requestId: `outgoing-${userId}`,  // Generate a unique ID for the request
                    receiverId: { 
                      ...profile,
                      _id: userId
                    }
                  };
                }
                return null;
              }));
              processedOutgoing = processedOutgoing.filter(req => req !== null);
            } else {
              // Old format - objects with sender/receiver
              processedOutgoing = outgoingRequests as any[];
              
              // Still fetch detailed profiles for old format
              await Promise.all((outgoingRequests as any[]).map(async (request: any) => {
                let receiverIdValue: string | undefined;
                
                if (typeof request.receiverId === 'object' && request.receiverId !== null && request.receiverId._id) {
                  receiverIdValue = request.receiverId._id;
                } else if (typeof request.receiverId === 'string') {
                  receiverIdValue = request.receiverId;
                }
                
                if (receiverIdValue) {
                  await fetchDetailedProfile(receiverIdValue);
                }
              }));
            }
          }
        }
        
        // If we couldn't get data from API, try to use data from currentUser
        if (processedIncoming.length === 0 && currentUser?.friendRequests?.incoming?.id) {
          const incomingIds = currentUser.friendRequests.incoming.id;
          processedIncoming = await Promise.all(incomingIds.map(async (userId: string) => {
            const profile = await fetchDetailedProfile(userId);
            if (profile) {
              return {
                requestId: `incoming-request-${userId}`,  // Use a different prefix to avoid ID conflicts
                senderId: { 
                  ...profile,
                  _id: userId
                }
              };
            }
            return null;
          }));
          processedIncoming = processedIncoming.filter(req => req !== null);
        }
        
        if (processedOutgoing.length === 0 && currentUser?.friendRequests?.outgoing?.id) {
          const outgoingIds = currentUser.friendRequests.outgoing.id;
          processedOutgoing = await Promise.all(outgoingIds.map(async (userId: string) => {
            const profile = await fetchDetailedProfile(userId);
            if (profile) {
              return {
                requestId: `outgoing-request-${userId}`,  // Use a different prefix to avoid ID conflicts
                receiverId: { 
                  ...profile,
                  _id: userId
                }
              };
            }
            return null;
          }));
          processedOutgoing = processedOutgoing.filter(req => req !== null);
        }
        
        setRequests({
          incoming: processedIncoming,
          outgoing: processedOutgoing
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

  const getUserP = async ({ userId } : any)=> {
    const response = await getUserProfile(userId);


    if (response.success && response.data) {
      setSelectedUser(response.data); 
    } else {
      console.error("Failed to fetch user profile", response.error);
      setSelectedUser(undefined); 
    }

  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(prev => ({ ...prev, search: true }));
      const response = await searchForUsers(searchQuery);
      
      // Handle different response formats and ensure valid data
      let validResults: IUser[] = [];
      
      if (Array.isArray(response)) {
        validResults = response.filter(user => user && user._id);
      } else if (response.success && Array.isArray(response.data)) {
        validResults = response.data.filter(user => user && user._id);
      } else if (response && typeof response === 'object') {
        // Log unexpected format but don't show error to user
        console.log('Search API response format:', response);
      } else {
        console.error('Search API returned unexpected format:', response);
      }
      
      setSearchResults(validResults);
      
      // Reload friends and requests to ensure UI is in sync
      await Promise.all([
        loadFriends(),
        loadRequests()
      ]);
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
      // Check if this is a "new-style" request with our generated ID
      const isGeneratedId = requestId.startsWith('incoming-request-') || requestId.startsWith('incoming-');
      
      if (isGeneratedId) {
        // Extract the actual user ID
        const senderId = requestId.replace('incoming-request-', '').replace('incoming-', '');
        
        // Handle directly with the user's ID rather than request ID
        // Construct endpoint with the userId
        const response = await fetch(`${API_BASE_URL}/request/${senderId}/accept`, {
          method: 'PUT',
          headers: getHeaders(),
          credentials: 'include'
        });
      } else {
        // Old style request, use the original function
        await acceptFriendRequestById(requestId);
      }
      
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
      // Check if this is a "new-style" request with our generated ID
      const isGeneratedId = requestId.startsWith('incoming-request-') || requestId.startsWith('incoming-');
      
      if (isGeneratedId) {
        // Extract the actual user ID
        const senderId = requestId.replace('incoming-request-', '').replace('incoming-', '');
        
        // Handle directly with the user's ID rather than request ID
        const response = await fetch(`${API_BASE_URL}/request/${senderId}/reject`, {
          method: 'PUT',
          headers: getHeaders(),
          credentials: 'include'
        });
      } else {
        // Old style request, use the original function
        await rejectFriendRequestById(requestId);
      }
      
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
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
              >
                {isLoading.search ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((user) => {
                  if (!user || !user._id) return null;
                  const showProfile = () => {
                    getUserP(user._id)
                  }
                  
                  const isCurrentUser = user._id === currentUser._id;
                  
                  return (
                    <li key={user._id} className="border p-4 rounded-lg flex items-center justify-between"
                    onClick={() => (
                      setIsProfileModalOpen(true),
                      showProfile()
                    )}
                    >
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
                     
                    </li>
                  );
                })}
              </ul>
            ) : !isLoading.search && searchQuery.trim() !== '' && (
              <div className="text-center p-4 bg-gray-50 rounded-lg mt-4">
                <p>No users found matching "{searchQuery}"</p>
              </div>
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
                    if (!request || !request.requestId) return null;
                    
                    // Extract the sender information
                    let senderId: string | undefined;
                    let senderData: any = null;
                    
                    // If senderId is an object with _id
                    if (typeof request.senderId === 'object' && request.senderId !== null && request.senderId._id) {
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
                    
                    return (
                      <li key={request.requestId} className="border p-4 rounded-lg">
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
                            onClick={() => {
                              const id = request._id || request.requestId;
                              if (id) acceptRequest(id);
                            }}
                            className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              const id = request._id || request.requestId;
                              if (id) rejectRequest(id);
                            }}
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
                    if (typeof request.receiverId === 'object' && request.receiverId !== null && request.receiverId._id) {
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

      {selectedUser && (
          <ProfileModal 
            isOpen={isProfileModalOpen} 
            onClose={() => setIsProfileModalOpen(false)} 
            user={selectedUser} 
          />
        )}
    </div>
  );
} 