  "use client";

  import { useState, useEffect } from 'react';
  import { useSocket } from '@/context/SocketContext';
  import { useAuth } from '@/context/AuthContext';
  import { ChatUser, Message } from '@/types/socket';
  import { IUser } from '@/types';
  import Link from 'next/link';
  import { messageService } from '@/lib/messageService';
  import { CircleDashedIcon } from 'lucide-react';
  import { spaceGrotesk } from '@/app/fonts';
  import { ProfileModal } from './ProfileModal';
  import { getUserProfile } from '@/api';
import Image from 'next/image';

  // Update ChatUser to include the full user data
  interface ExtendedChatUser extends ChatUser {
    userData: IUser; // Store the full user data
  }

  interface ConversationListProps {
    activeConversationId?: string;
    onSelectConversation?: (userId: string) => void;
    friendsList?: IUser[];
  }

  const ConversationList: React.FC<ConversationListProps> = ({
    activeConversationId,
    onSelectConversation,
    friendsList = []
  }) => {
    const { onlineUsers, isConnected } = useSocket();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ExtendedChatUser[]>([]);
    const [messages, setMessages] = useState<{ [userId: string]: Message[] }>({});
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Process friendsList to create conversation list
    useEffect(() => {
      if (!user || !friendsList || friendsList.length === 0) return;

      const fetchAllProfiles = async () => {
        try {
          // Create array of promises for all profile fetches
          const profilePromises = friendsList.map(async (friend: IUser) => {
            if (!friend._id) return null;
            
            const data = await getUserProfile(friend._id);
            
            return {
              friend,
              profileData: data.data as IUser,
            };
          });
          
          const results = await Promise.all(profilePromises);
          
          const conversationMap = new Map<string, ExtendedChatUser>();
          
          results.forEach(result => {
            if (!result || !result.friend._id) return;
            
            conversationMap.set(result.friend._id, {
              id: result.friend._id,
              name: result.friend.displayName || result.friend.username || `User ${result.friend._id.substring(0, 5)}...`,
              avatar: result.friend.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.friend.displayName || result.friend.username || 'U')}`,
              isOnline: onlineUsers.includes(result.friend._id),
              userData: result.profileData
            });
          });

          // Also check if user has friends in the new schema structure
          if (friendsList.length === 0 && user.friends?.id && Array.isArray(user.friends.id)) {
            const friendIds = user.friends.id;
            
            // Fetch profiles for each friend ID
            for (const friendId of friendIds) {
              if (!friendId) continue;
              
              try {
                const data = await getUserProfile(friendId);
                
                if (data.success && data.data) {
                  const friendData = data.data as IUser;
                  
                  conversationMap.set(friendId, {
                    id: friendId,
                    name: friendData.displayName || friendData.username || `User ${friendId.substring(0, 5)}...`,
                    avatar: friendData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendData.displayName || friendData.username || 'U')}`,
                    isOnline: onlineUsers.includes(friendId),
                    userData: friendData
                  });
                }
              } catch (err) {
                console.error(`Failed to fetch profile for friend ID ${friendId}:`, err);
              }
            }
          }
          
          // Convert map to array and update state
          setConversations(Array.from(conversationMap.values()));
          
          // Now fetch messages for each friend
          const allFriendIds = [...conversationMap.keys()];
          allFriendIds.forEach(async (friendId: string) => {
            if (!friendId) return;

            try {
              // Try to fetch just the latest message for each friend
              const messages = await messageService.getMessages(friendId);
              if (messages && messages.length > 0) {
                const formattedMessages = messages.map(msg =>
                  messageService.convertToFrontendMessage(msg)
                );

                setMessages(prev => ({
                  ...prev,
                  [friendId]: formattedMessages
                }));
              }
            } catch (error) {
              console.error(`Failed to load messages for ${friendId}:`, error);
            }
          });
        } catch (error) {
          console.error('Error fetching profiles:', error);
        }
      };

      fetchAllProfiles();
    }, [friendsList, user, onlineUsers]);

    // Get the last message for a conversation
    const getLastMessage = (userId: string): Message | null => {
      const conversationMessages = messages[userId] || [];
      if (conversationMessages.length === 0) return null;
      // Sort by date to get the most recent message
      const sorted = [...conversationMessages].sort((a, b) =>
        new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime()
      );
      return sorted[0];
    };

    // Format the timestamp for the last message
    const formatLastMessageTime = (userId: string): string => {
      const lastMessage = getLastMessage(userId);
      if (!lastMessage?.createdAt) return '';

      const messageDate = new Date(lastMessage.createdAt);
      const now = new Date();

      // If today, show time
      if (messageDate.toDateString() === now.toDateString()) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      // If within the last 7 days, show day name
      const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return messageDate.toLocaleDateString([], { weekday: 'short' });
      }

      // Otherwise show date
      return messageDate.toLocaleDateString();
    };

    // Get count of unread messages for a conversation
    const getUnreadCount = (userId: string): number => {
      const conversationMessages = messages[userId] || [];
      return conversationMessages.filter(msg =>
        msg.senderId === userId && !msg.isRead
      ).length;
    };

    // Handle click on a conversation
    const handleClick = (userId: string) => {
      if (onSelectConversation) {
        onSelectConversation(userId);
      }
    };

    // Handle opening profile modal
    const openProfileModal = (user: IUser) => {
      setSelectedUser(user);
      setIsProfileModalOpen(true);
    };

    return (
      <div className={`${spaceGrotesk.className} flex flex-col gap-4 h-full w-full`}>
        <div className="flex items-center w-full justify-center py-5 ">
          <div className="flex gap-1 bg-[#F46D38] text-black rounded-full px-4 py-2">
            <h2 className="text-xl font-semibold">Convo </h2>
            <h2 className="text-xl font-semibold">{"/"}</h2>
            <h2 className="text-xl font-semibold">Buddies </h2>
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="p-4  text-gray-500 h-full text-center">
            <p>No conversations yet</p>
            <Link href="/friends" className="text-blue-500 hover:underline block mt-2">
              Find friends to chat with
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col w-full h-full">
            {conversations.map(conv => {
              const lastMessage = getLastMessage(conv.id);
              const unreadCount = getUnreadCount(conv.id);
              const isActive = activeConversationId === conv.id;
              const isUserOnline = onlineUsers.includes(conv.id);

              return (
                <div key={conv.id} className={`${spaceGrotesk.className} rounded-full `}>
                  <li
                    className={` mx-4 hover:bg-white/15 rounded-full items-center cursor-pointer flex justify-center transition-all  duration-100 
                    ${isActive ? 'bg-[#151312]' : ''}`}
                    onClick={() => handleClick(conv.id)}
                  >
                    <div className="flex w-[100%] justify-start">
                      <div 
                        className="relative"
                        style={{
                          height: 'clamp(2rem, 3.25vw, 100rem)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfileModal(conv.userData as IUser);
                        }}
                      >
                        <Image
                        width={200}
                        height={200}
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-auto h-full object-cover aspect-square rounded-full"
                        />
                        {isUserOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className={`ml-2 flex justify-between items-center w-[80%] ${isActive ? 'text-white' : 'text-white'}`}>
                        <div className={`flex w-[80%] flex-col justify-between items-start`}>
                          <h3 className="font-medium ">{conv.name}</h3>
                          <p className="text-sm -mt-1  truncate max-w-[180px]">
                            {lastMessage?.text || ''}
                          </p>
                        </div>


                        <div className="flex w-[20%] justify-center">
                          {unreadCount > 0 && (
                            <div className={`p-1 translate-x-2 aspect-square w-7 h-7 text-sm font-semibold flex items-center justify-center rounded-full ${isActive ? 'bg-white text-[#151312]' : 'bg-[#C2F949] text-white'}`}>
                              <CircleDashedIcon color='black' />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                  <hr className='w-[50%] opacity-70 border-white mx-auto my-2'/>
                </div>
              );
            })}
          </ul>
        )}

        {selectedUser && (
          <ProfileModal 
            isOpen={isProfileModalOpen} 
            onClose={() => setIsProfileModalOpen(false)} 
            user={selectedUser} 
          />
        )}
      </div>
    );
  };

  export default ConversationList; 