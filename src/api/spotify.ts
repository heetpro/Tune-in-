import { API_BASE_URL, ApiResponse } from './config';
import Cookies from 'js-cookie';

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
  spotifyId?: string;
}

interface Track {
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
 * Helper function to make API requests with consistent error handling
 */
const makeSpotifyRequest = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
  try {
    const token = Cookies.get('auth_token');
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
      mode: 'cors'
    });
    
    console.log(`API response status for ${endpoint}:`, response.status);
    
    if (!response.ok) {
      console.error(`Error with ${endpoint}:`, response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      if (response.status === 401) {
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
      }
      
      return {
        success: false,
        message: errorData.message || `API error: ${response.status} ${response.statusText}`,
        error: errorData
      };
    }
    
    try {
      // Parse response data
      const responseData = await response.json();
      console.log(`Response data from ${endpoint}:`, responseData);
      
      // If response already has success field, return as is
      if (responseData.hasOwnProperty('success')) {
        return responseData;
      }
      
      // If the endpoint is expected to return an array but returns null/undefined
      if (
        (endpoint.includes('top-artists') || 
         endpoint.includes('top-tracks') || 
         endpoint.includes('top-genres') || 
         endpoint.includes('recent-tracks') || 
         endpoint.includes('playlists')) && 
        (responseData === null || responseData === undefined)
      ) {
        return {
          success: true,
          data: [] as unknown as T
        };
      }
      
      // Otherwise wrap in expected format
      return {
        success: true,
        data: responseData
      };
    } catch (error) {
      console.error(`Failed to parse response from ${endpoint}:`, error);
      return {
        success: false,
        message: 'Failed to parse API response',
        error
      };
    }
  } catch (error) {
    console.error(`Failed request to ${endpoint}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Syncs user data from Spotify
 */
export const syncSpotifyData = async (): Promise<ApiResponse<null>> => {
  return makeSpotifyRequest('/spotify/sync');
};

/**
 * Gets user's music profile from Spotify
 */
export const getSpotifyProfile = async (): Promise<ApiResponse<SpotifyProfile>> => {
  return makeSpotifyRequest('/spotify/profile');
};

/**
 * Gets user's top artists
 */
export const getTopArtists = async (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<ApiResponse<Artist[]>> => {
  try {
    const response = await makeSpotifyRequest<any>(`/spotify/top-artists?time_range=${timeRange}`);
    console.log('Top artists response:', response);
    
    if (!response.success) {
      return response as ApiResponse<Artist[]>;
    }
    
    // Handle the specific response format we received from the backend
    if (response.data && typeof response.data === 'object') {
      // Case 1: If response contains timeRange and artists array format
      if (response.data.timeRange && response.data.artists && Array.isArray(response.data.artists)) {
        return {
          success: true,
          data: response.data.artists
        };
      }
      
      // Case 2: If response contains nested time ranges in topArtists
      if (response.data.topArtists && response.data.topArtists[timeRange]) {
        return {
          success: true,
          data: response.data.topArtists[timeRange]
        };
      }
      
      // Case 3: If response directly contains the time range data
      if (response.data[timeRange]) {
        return {
          success: true,
          data: response.data[timeRange]
        };
      }
      
      // Case 4: If response is already an array, use it directly
      if (Array.isArray(response.data)) {
        return response as ApiResponse<Artist[]>;
      }
    }
    
    // Fallback to empty array
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error in getTopArtists:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Gets user's top tracks
 */
export const getTopTracks = async (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<ApiResponse<Track[]>> => {
  try {
    const response = await makeSpotifyRequest<any>(`/spotify/top-tracks?time_range=${timeRange}`);
    console.log('Top tracks response:', response);
    
    if (!response.success) {
      return response as ApiResponse<Track[]>;
    }
    
    // Handle the specific response format we received from the backend
    if (response.data && typeof response.data === 'object') {
      // Case 1: If response contains timeRange and tracks array format
      if (response.data.timeRange && response.data.tracks && Array.isArray(response.data.tracks)) {
        return {
          success: true,
          data: response.data.tracks
        };
      }
      
      // Case 2: If response contains nested time ranges in topTracks
      if (response.data.topTracks && response.data.topTracks[timeRange]) {
        return {
          success: true,
          data: response.data.topTracks[timeRange]
        };
      }
      
      // Case 3: If response directly contains the time range data
      if (response.data[timeRange]) {
        return {
          success: true,
          data: response.data[timeRange]
        };
      }
      
      // Case 4: If response is already an array, use it directly
      if (Array.isArray(response.data)) {
        return response as ApiResponse<Track[]>;
      }
    }
    
    // Fallback to empty array
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error in getTopTracks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Gets user's recently played tracks
 */
export const getRecentTracks = async (): Promise<ApiResponse<Track[]>> => {
  try {
    const response = await makeSpotifyRequest<any>('/spotify/recent-tracks');
    
    if (!response.success) {
      return response as ApiResponse<Track[]>;
    }
    
    // Handle different response formats
    if (response.data) {
      // If response contains recentTracks array
      if (response.data.recentTracks && Array.isArray(response.data.recentTracks)) {
        return {
          success: true,
          data: response.data.recentTracks
        };
      }
      
      // If response contains recentlyPlayed array with track property
      if (response.data.recentlyPlayed && Array.isArray(response.data.recentlyPlayed)) {
        return {
          success: true,
          data: response.data.recentlyPlayed.map((item: any) => item.track || item)
        };
      }
      
      // If response is already an array
      if (Array.isArray(response.data)) {
        return response as ApiResponse<Track[]>;
      }
    }
    
    // Fallback to empty array
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error in getRecentTracks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Gets user's playlists
 */
export const getPlaylists = async (): Promise<ApiResponse<Playlist[]>> => {
  return makeSpotifyRequest('/spotify/playlists');
};

/**
 * Gets user's current track
 */
export const getCurrentTrack = async (): Promise<ApiResponse<Track | null>> => {
  return makeSpotifyRequest('/spotify/current-track');
};

/**
 * Gets user's top genres
 */
export const getTopGenres = async (): Promise<ApiResponse<Array<{name: string, count: number, weight?: number}>>> => {
  try {
    const response = await makeSpotifyRequest<any>('/spotify/top-genres');
    console.log('Top genres response:', response);
    
    if (!response.success) {
      return response as ApiResponse<Array<{name: string, count: number, weight?: number}>>;
    }
    
    // Handle different response formats
    if (response.data) {
      // If response contains topGenres array
      if (response.data.topGenres && Array.isArray(response.data.topGenres)) {
        return {
          success: true,
          data: response.data.topGenres.map((genre: any) => ({
            name: genre.name,
            count: genre.count || 0,
            weight: genre.weight || 0
          }))
        };
      }
      
      // If response is already an array
      if (Array.isArray(response.data)) {
        // Ensure each item has required properties
        return {
          success: true,
          data: response.data.map((genre: any) => ({
            name: genre.name || '',
            count: genre.count || genre.weight * 100 || 0,
            weight: genre.weight || genre.count / 100 || 0
          }))
        };
      }
    }
    
    // Fallback to empty array
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error in getTopGenres:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error
    };
  }
};

/**
 * Gets audio features for user's top tracks
 */
export const getAudioFeatures = async (): Promise<ApiResponse<{averageFeatures: AudioFeatures, tracks: Array<Track & {features: AudioFeatures}>}>> => {
  return makeSpotifyRequest('/spotify/audio-features');
}; 