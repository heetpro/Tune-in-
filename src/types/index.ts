// User interfaces
export interface IUser {
  _id: string;
  spotifyId: string;
  username?: string;
  displayName: string;
  firstName: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  age?: number;
  gender?: string;
  intrestedIn?: string[];
  location?: { 
    city?: string;
    country?: string;
  };
  isOnline: boolean;
  lastSeen?: Date;
  isActive: boolean;
  friends: string[];
  friendRequests: {
    incoming: string[];
    outgoing: string[];
  };
  spotifyFollowers?: number;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
  hasCompletedOnboarding?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
}

// Friend request interfaces
export interface IFriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Message interfaces
export interface IMessage {
  _id: string;
  receiverId: string;
  senderId: string;
  text?: string;
  image?: string;
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketData {
  userId?: string;
  message?: IMessage;
  conversationId?: string;
}

// Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// Auth related interfaces
export interface AuthResponse {
  token: string;
  user: IUser;
} 