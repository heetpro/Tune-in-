// User interfaces
export interface IUser {
    _id: string;
    spotifyId: string;
    username?: string;
    displayName: string;
    firstName: string;
    lastName?: string;
    profilePicture: string;
    bio: string;
    age: number;
    gender: 'male' | 'female' | 'non-binary' | 'other';
    intrestedIn: ('male' | 'female' | 'non-binary' | 'other')[];
    spotifyFollowers?: number;
    location: {
        city: string;
        country: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    lastSeen: Date;
    dailyRolls: {
        date: Date;
        count: number;
    };
    musicProfile?: string | IMusicProfile; // ObjectId as string
    friends: {
        id: string[];
    };
    friendRequests: {
        incoming: {
            id: string[];
        };
        outgoing: {
            id: string[];
        };
    };
    privacySettings: {
        showAge: boolean;
        showLocation: boolean;
        showLastSeen: boolean;
    };
    notifications: {
        newMessages: boolean;
        newLikes: boolean;
        newMatches: boolean;
        newFriendRequests: boolean;
    };
    isPremium: boolean;
    isVerified: boolean;
    isBanned: boolean;
    banReason?: string;
    banExpiresAt?: Date;
    isAdmin?: boolean;
    hasCompletedOnboarding: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
}

export interface OnboardingFormData {
    username: string;
    displayName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'non-binary' | 'other';
    intrestedIn: string[];
    location: {
        city: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}

// Music profile interfaces
export interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: Array<{url: string}>;
  spotifyId?: string;
}

export interface SpotifyAlbum {
  spotifyId?: string;
  id?: string;
  albumType?: string;
  genres?: string[];
  name: string;
  artists?: SpotifyArtist[];
  images?: SpotifyImage[];
  releaseDate?: Date;
  totalTracks?: number;
  externalUrl?: {
    spotify?: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images: Array<{url: string}>;
    spotifyId?: string;
  };
  artists: Array<{name: string, id: string, spotifyId?: string}>;
  popularity: number;
  spotifyId?: string;
}

export interface SpotifyCurrentTrack extends SpotifyTrack {
  isPlaying?: boolean;
  progressMs?: number;
  timestamp?: Date;
}

export interface SpotifyRecentlyPlayedTrack {
  track: SpotifyTrack;
  playedAt?: string;
  context?: {
    type?: 'album' | 'artist' | 'playlist' | 'show';
    href?: string;
    externalUrls?: {
      spotify?: string;
    };
    uri?: string;
  };
}

export interface SpotifyPlaylist {
  spotifyId?: string;
  id?: string;
  public?: boolean;
  name: string;
  description?: string;
  collaborative?: boolean;
  owner?: {
    spotifyId?: string;
    displayName?: string;
  };
  images?: SpotifyImage[];
  externalUrl?: {
    spotify?: string;
  };
}

export interface SpotifyGenre {
  name: string;
  count?: number;
  weight?: number;
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
}

export interface IMusicProfile {
  topArtists: {
    short_term: SpotifyArtist[];
    medium_term: SpotifyArtist[];
    long_term: SpotifyArtist[];
  };
  topTracks: {
    short_term: SpotifyTrack[];
    medium_term: SpotifyTrack[];
    long_term: SpotifyTrack[];
  };
  topGenres: SpotifyGenre[] | {
    short_term: SpotifyGenre[];
    medium_term: SpotifyGenre[];
    long_term: SpotifyGenre[];
  };
  recentTracks?: SpotifyTrack[];
  currentlyPlaying?: SpotifyTrack;
  audioFeatures?: AudioFeatures;
  playlistCount?: number;
  lastSyncAt?: string;
  spotifyConnected?: boolean;
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
  isDelivered?: boolean;
  isDeleted?: boolean;
  readAt?: Date;
  createdAt?: Date;
  // UI specific fields
  pending?: boolean;
  error?: boolean;
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