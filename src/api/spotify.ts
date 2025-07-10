import { API_BASE_URL, getHeaders, handleApiResponse, ApiResponse } from './config';

interface SpotifyProfile {
  id: string;
  displayName: string;
  followers: number;
  images: Array<{url: string}>;
  country: string;
}

interface Artist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: Array<{url: string}>;
}

interface Track {
  id: string;
  name: string;
  album: {
    name: string;
    images: Array<{url: string}>;
  };
  artists: Array<{name: string, id: string}>;
  popularity: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{url: string}>;
  tracks: {
    total: number;
  };
  owner: {
    id: string;
    display_name: string;
  };
}

interface AudioFeatures {
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

/**
 * Syncs user data from Spotify
 */
export const syncSpotifyData = async (): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/sync`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<null>(response);
  } catch (error) {
    console.error('Failed to sync Spotify data:', error);
    throw error;
  }
};

/**
 * Gets user's music profile from Spotify
 */
export const getSpotifyProfile = async (): Promise<ApiResponse<SpotifyProfile>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/profile`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<SpotifyProfile>(response);
  } catch (error) {
    console.error('Failed to fetch Spotify profile:', error);
    throw error;
  }
};

/**
 * Gets user's top artists
 */
export const getTopArtists = async (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<ApiResponse<Artist[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/top-artists?time_range=${timeRange}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Artist[]>(response);
  } catch (error) {
    console.error('Failed to fetch top artists:', error);
    throw error;
  }
};

/**
 * Gets user's top tracks
 */
export const getTopTracks = async (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<ApiResponse<Track[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/top-tracks?time_range=${timeRange}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Track[]>(response);
  } catch (error) {
    console.error('Failed to fetch top tracks:', error);
    throw error;
  }
};

/**
 * Gets user's recently played tracks
 */
export const getRecentTracks = async (): Promise<ApiResponse<Track[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/recent-tracks`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Track[]>(response);
  } catch (error) {
    console.error('Failed to fetch recent tracks:', error);
    throw error;
  }
};

/**
 * Gets user's playlists
 */
export const getPlaylists = async (): Promise<ApiResponse<Playlist[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/playlists`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Playlist[]>(response);
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    throw error;
  }
};

/**
 * Gets user's current track
 */
export const getCurrentTrack = async (): Promise<ApiResponse<Track | null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/current-track`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Track | null>(response);
  } catch (error) {
    console.error('Failed to fetch current track:', error);
    throw error;
  }
};

/**
 * Gets user's top genres
 */
export const getTopGenres = async (): Promise<ApiResponse<Array<{name: string, count: number}>>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/top-genres`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<Array<{name: string, count: number}>>(response);
  } catch (error) {
    console.error('Failed to fetch top genres:', error);
    throw error;
  }
};

/**
 * Gets audio features for user's top tracks
 */
export const getAudioFeatures = async (): Promise<ApiResponse<{averageFeatures: AudioFeatures, tracks: Array<Track & {features: AudioFeatures}>}>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/spotify/audio-features`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });
    
    return await handleApiResponse<{averageFeatures: AudioFeatures, tracks: Array<Track & {features: AudioFeatures}>}>(response);
  } catch (error) {
    console.error('Failed to fetch audio features:', error);
    throw error;
  }
}; 