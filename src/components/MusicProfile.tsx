"use client";

import { useState, useEffect } from 'react';
import { getTopArtists, getTopTracks, getTopGenres } from '@/api/spotify';

// Match API response formats
interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  images: Array<{url: string}>;
  spotifyId?: string;
}

interface SpotifyTrack {
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

interface SpotifyGenre {
  name: string;
  count: number;
  weight?: number;
}

interface MusicProfileProps {
  userId?: string; // If provided, shows someone else's profile
}

const MusicProfile: React.FC<MusicProfileProps> = ({ userId }) => {
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topGenres, setTopGenres] = useState<SpotifyGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState<'artists' | 'tracks' | 'genres'>('artists');

  const fetchMusicData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data in parallel
      const [artistsResponse, tracksResponse, genresResponse] = await Promise.all([
        getTopArtists(timeRange),
        getTopTracks(timeRange),
        getTopGenres()
      ]);
      
      if (artistsResponse.success && artistsResponse.data) {
        setTopArtists(artistsResponse.data);
      }
      
      if (tracksResponse.success && tracksResponse.data) {
        setTopTracks(tracksResponse.data);
      }
      
      if (genresResponse.success && genresResponse.data) {
        setTopGenres(genresResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch music data:', error);
      setError(error.message || 'Failed to load music profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicData();
  }, [timeRange, userId]);

  const timeRangeLabels = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMusicData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold mb-4 sm:mb-0">Your Music Profile</h2>
        
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(timeRangeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'artists', label: 'Top Artists', count: topArtists.length },
            { id: 'tracks', label: 'Top Tracks', count: topTracks.length },
            { id: 'genres', label: 'Top Genres', count: topGenres.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Artists Tab */}
      {activeTab === 'artists' && (
        <div className="grid gap-4">
          {topArtists.slice(0, 10).map((artist, index) => (
            <div key={artist.spotifyId || artist.id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">
                  {index + 1}
                </span>
              </div>
              
              {artist.images && artist.images[0] && (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{artist.name}</h3>
                <p className="text-sm text-gray-500">
                  {artist.genres?.slice(0, 3).join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  Popularity: {artist.popularity}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracks Tab */}
      {activeTab === 'tracks' && (
        <div className="grid gap-4">
          {topTracks.slice(0, 10).map((track, index) => (
            <div key={track.spotifyId || track.id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium">
                  {index + 1}
                </span>
              </div>
              
              {track.album?.images && track.album.images[0] && (
                <img
                  src={track.album.images[0].url}
                  alt={track.album.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{track.name}</h3>
                <p className="text-sm text-gray-500">
                  {track.artists?.map(artist => artist.name).join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  {track.album?.name} • Popularity: {track.popularity}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {topGenres.slice(0, 15).map((genre, index) => (
            <div key={genre.name || index} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                #{index + 1}
              </div>
              <div className="font-medium text-gray-900 capitalize mb-1">
                {genre.name}
              </div>
              <div className="text-sm text-gray-500">
                {Math.round((genre.weight || genre.count / 100 || 0) * 100)}% match
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicProfile; 