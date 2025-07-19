import { apiRequest } from './config';

// Get user's top artists with time range parameter
export const getTopArtists = async (timeRange: string = 'medium_term') => {
  console.log(`Calling getTopArtists API with timeRange: ${timeRange}`);
  return apiRequest({
    url: `/spotify/top-artists?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's top tracks with time range parameter
export const getTopTracks = async (timeRange: string = 'medium_term') => {
  console.log(`Calling getTopTracks API with timeRange: ${timeRange}`);
  return apiRequest({
    url: `/spotify/top-tracks?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's top genres with time range parameter
export const getTopGenres = async (timeRange: string = 'medium_term') => {
  console.log(`Calling getTopGenres API with timeRange: ${timeRange}`);
  return apiRequest({
    url: `/spotify/top-genres?time_range=${timeRange}`,
    method: 'GET'
  });
};

// Get user's complete music profile
export const getMusicProfile = async () => {
  console.log('Calling getMusicProfile API');
  return apiRequest({
    url: '/spotify/profile',
    method: 'GET'
  });
}; 