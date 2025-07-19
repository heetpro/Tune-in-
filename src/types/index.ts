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
    gender?: 'male' | 'female' | 'non-binary' | 'other';
    intrestedIn?: string[];
    location?: {
        city: string;
        country: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    lastSeen?: Date;
    dailyRolls?: {
        date: Date;
        count: number;
    };
    musicProfile?: string; // ObjectId as string
    friends: string[];
    friendRequests: {
        incoming: string[];
        outgoing: string[];
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
    isAdmin: boolean;
    hasCompletedOnboarding: boolean;
    createdAt: Date;
    updatedAt: Date;
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
  spotifyId?: string;
  id?: string;
  name: string;
  genres?: string[];
  popularity?: number;
  images?: SpotifyImage[];
  externalUrl?: {
    spotify?: string;
  };
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
  spotifyId?: string;
  id?: string;
  name: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  duration?: number;
  popularity?: number;
  explicit?: boolean;
  previewUrl?: string;
  externalUrl?: {
    spotify?: string;
  };
  audioFeatures?: IAudioFeatures | Record<string, number>;
  href?: string;
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
  weight?: number;
  count?: number;
}

export interface IAudioFeatures {
  danceability?: number;
  energy?: number;
  key?: number;
  mode?: number;
  speechiness?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  valence?: number;
  tempo?: number;
  duration?: number;
  timeSignature?: number;
  loudness?: number;
}

export interface IMusicProfile {
  spotifyConnected?: boolean;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiresAt?: Date;
  currentlyPlaying?: SpotifyCurrentTrack;
  recentTracks?: SpotifyTrack[];
  recentlyPlayed?: SpotifyRecentlyPlayedTrack[];
  topArtists?: {
    short_term?: SpotifyArtist[];
    medium_term?: SpotifyArtist[];
    long_term?: SpotifyArtist[];
  };
  topTracks?: {
    short_term?: SpotifyTrack[];
    medium_term?: SpotifyTrack[];
    long_term?: SpotifyTrack[];
  };
  topGenres?: SpotifyGenre[];
  audioFeatures?: IAudioFeatures;
  playlists?: SpotifyPlaylist[];
  compatibilityScore?: Record<string, number>;
  lastSyncAt?: Date;
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