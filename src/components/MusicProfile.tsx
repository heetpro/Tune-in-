"use client";

import { useState, useEffect } from 'react';
import { getTopArtists, getTopTracks, getTopGenres } from '@/api';

interface TopArtist {
  id: string;
  name: string;
  images: Array<{url: string}>;
  genres: string[];
}

interface TopTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images: Array<{url: string}>;
  };
  artists: Array<{name: string, id: string}>;
}

interface TopGenre {
  name: string;
  count: number;
}

interface MusicProfileProps {
  userId?: string; // If provided, shows someone else's profile
}

const MusicProfile: React.FC<MusicProfileProps> = ({ userId }) => {
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topGenres, setTopGenres] = useState<TopGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [activeTab, setActiveTab] = useState<'artists' | 'tracks' | 'genres'>('artists');

  useEffect(() => {
    const fetchMusicData = async () => {
      setLoading(true);
      try {
        // Fetch data in parallel
        const [artistsResponse, tracksResponse, genresResponse] = await Promise.all([
          getTopArtists(timeRange),
          getTopTracks(timeRange),
          getTopGenres()
        ]);
        
        if (artistsResponse.data) {
          setTopArtists(artistsResponse.data);
        }
        
        if (tracksResponse.data) {
          setTopTracks(tracksResponse.data);
        }
        
        if (genresResponse.data) {
          setTopGenres(genresResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch music data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMusicData();
  }, [timeRange, userId]);

  const timeRangeLabels = {
    short_term: 'Last 4 Weeks',
    medium_term: 'Last 6 Months',
    long_term: 'All Time'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Music Profile</h2>
        <div className="flex space-x-2">
          {Object.entries(timeRangeLabels).map(([range, label]) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as 'short_term' | 'medium_term' | 'long_term')}
              className={`px-3 py-1 text-sm rounded-full ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 ${
            activeTab === 'artists'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('artists')}
        >
          Top Artists
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'tracks'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tracks')}
        >
          Top Tracks
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'genres'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('genres')}
        >
          Top Genres
        </button>
      </div>

      {/* Artists Tab */}
      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topArtists.slice(0, 10).map((artist) => (
            <div key={artist.id} className="text-center">
              <img
                src={artist.images[0]?.url || '/default-artist.png'}
                alt={artist.name}
                className="w-full aspect-square object-cover rounded-lg mb-2"
              />
              <h3 className="font-medium text-sm truncate">{artist.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Tracks Tab */}
      {activeTab === 'tracks' && (
        <div className="space-y-4">
          {topTracks.slice(0, 10).map((track) => (
            <div key={track.id} className="flex items-center">
              <img
                src={track.album.images[0]?.url || '/default-album.png'}
                alt={track.album.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="ml-4">
                <h3 className="font-medium">{track.name}</h3>
                <p className="text-sm text-gray-500">
                  {track.artists.map((a) => a.name).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topGenres.slice(0, 15).map((genre) => (
            <div
              key={genre.name}
              className="bg-gray-100 rounded-full px-4 py-2 text-center"
            >
              <span className="font-medium">{genre.name}</span>
              <span className="text-sm text-gray-500 ml-2">({genre.count})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicProfile; 