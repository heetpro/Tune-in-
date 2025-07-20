import { apiRequest } from './config';

// Get user's top artists with time range parameter
export const getTopArtists = async (timeRange: string = 'medium_term') => {
  return apiRequest({
    url: `/spotify/top-artists?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's top tracks with time range parameter
export const getTopTracks = async (timeRange: string = 'medium_term') => {
  return apiRequest({
    url: `/spotify/top-tracks?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's top genres with time range parameter
export const getTopGenres = async (timeRange: string = 'medium_term') => {
  return apiRequest({
    url: `/spotify/top-genres?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's complete music profile
export const getMusicProfile = async (userId: string) => {
  return apiRequest({
    url: `/spotify/profile/${userId}`,
    method: 'GET'
  });
}; 

export const getMyMusicProfile = async () => {
  return apiRequest({
    url: '/spotify/profile',
    method: 'GET'
  });
};