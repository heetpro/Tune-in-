export interface OpenCageResponse {
  documentation: string;
  licenses: Array<{
    name: string;
    url: string;
  }>;
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
  results: Array<{
    annotations: {
      DMS: {
        lat: string;
        lng: string;
      };
      MGRS: string;
      Maidenhead: string;
      Mercator: {
        x: number;
        y: number;
      };
      OSM: {
        edit_url: string;
        note_url: string;
        url: string;
      };
      UN_M49: {
        regions: {
          [key: string]: string;
        };
        statistical_groupings: string[];
      };
      callingcode: number;
      currency: {
        alternate_symbols: string[];
        decimal_mark: string;
        html_entity: string;
        iso_code: string;
        iso_numeric: string;
        name: string;
        smallest_denomination: number;
        subunit: string;
        subunit_to_unit: number;
        symbol: string;
        symbol_first: number;
        thousands_separator: string;
      };
      flag: string;
      geohash: string;
      qibla: number;
      roadinfo: {
        drive_on: string;
        road: string;
        speed_in: string;
      };
      sun: {
        rise: {
          apparent: number;
          astronomical: number;
          civil: number;
          nautical: number;
        };
        set: {
          apparent: number;
          astronomical: number;
          civil: number;
          nautical: number;
        };
      };
      timezone: {
        name: string;
        now_in_dst: number;
        offset_sec: number;
        offset_string: string;
        short_name: string;
      };
      what3words: {
        words: string;
      };
    };
    bounds: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
    components: {
      'ISO_3166-1_alpha-2': string;
      'ISO_3166-1_alpha-3': string;
      '_category': string;
      '_type': string;
      city?: string;
      continent: string;
      country: string;
      country_code: string;
      county?: string;
      postcode?: string;
      road?: string;
      state?: string;
      state_code?: string;
      suburb?: string;
      town?: string;
      village?: string;
    };
    confidence: number;
    formatted: string;
    geometry: {
      lat: number;
      lng: number;
    };
  }>;
  status: {
    code: number;
    message: string;
  };
  stay_informed: {
    blog: string;
    mastodon: string;
    twitter: string;
  };
  thanks: string;
  timestamp: {
    created_http: string;
    created_unix: number;
  };
  total_results: number;
}

export interface LocationData {
  city: string;
  country: string;
  countryCode: string;
  state?: string;
  county?: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
const BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';

export class GeocodingService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENCAGE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenCage API key is required');
    }
  }

  /**
   * Reverse geocode coordinates to get location information
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    language: string = 'en'
  ): Promise<LocationData | null> {
    try {
      const url = new URL(BASE_URL);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('q', `${latitude},${longitude}`);
      url.searchParams.append('language', language);
      url.searchParams.append('pretty', '1');
      url.searchParams.append('no_annotations', '0');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenCageResponse = await response.json();

      if (data.status.code === 200 && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;

        return {
          city: components.city || components.town || components.village || '',
          country: components.country || '',
          countryCode: components.country_code?.toUpperCase() || '',
          state: components.state || '',
          county: components.county || '',
          formattedAddress: result.formatted,
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to reverse geocode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Forward geocode address to get coordinates
   */
  async forwardGeocode(
    address: string,
    language: string = 'en'
  ): Promise<LocationData | null> {
    try {
      const url = new URL(BASE_URL);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('q', address);
      url.searchParams.append('language', language);
      url.searchParams.append('pretty', '1');
      url.searchParams.append('limit', '1');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenCageResponse = await response.json();

      if (data.status.code === 200 && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;

        return {
          city: components.city || components.town || components.village || '',
          country: components.country || '',
          countryCode: components.country_code?.toUpperCase() || '',
          state: components.state || '',
          county: components.county || '',
          formattedAddress: result.formatted,
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to geocode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Hook for use in React components
import { useState, useCallback } from 'react';

export const useGeocoding = (apiKey?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const geocodingService = new GeocodingService(apiKey);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await geocodingService.reverseGeocode(latitude, longitude);
      setLocationData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reverse geocode';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [geocodingService]);

  const forwardGeocode = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await geocodingService.forwardGeocode(address);
      setLocationData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to geocode';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [geocodingService]);

  return {
    reverseGeocode,
    forwardGeocode,
    locationData,
    loading,
    error,
  };
}; 