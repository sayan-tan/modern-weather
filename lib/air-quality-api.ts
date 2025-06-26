// Air Quality API using only IQAir
import { geocodeCity } from './openweathermap-api';
import { IQAIR_API_KEY } from './env';

export interface AirQualityData {
  aqi: number;
  mainPollutant: string;
  city: string;
  country: string;
  state: string;
  source: string;
  timestamp: number;
  raw: unknown;
}

export interface IQAirAQIResult {
  aqi: number;
  mainPollutant: string;
  city: string;
  country: string;
  state: string;
  raw: unknown;
}

// IQAir API implementation (direct API call)
async function fetchIQAirAQI(lat: number, lon: number): Promise<AirQualityData | null> {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    console.warn('Invalid coordinates for IQAir API');
    return null;
  }

  if (!IQAIR_API_KEY) {
    console.warn('IQAir API key not configured');
    return null;
  }

  try {
    const url = `http://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${IQAIR_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Failed to fetch AQI data from IQAir API');
      return null;
    }
    const data = await response.json();

    // Check for error response from IQAir API
    if (data.status !== 'success') {
      console.warn('IQAir API error:', data.data?.message || 'Unknown error');
      return null;
    }

    const cityData = data.data;
    const current = cityData.current;

    // Validate required fields
    if (!current || typeof current.pollution?.aqius !== 'number') {
      console.warn('Invalid AQI data format received from IQAir');
      return null;
    }

    return {
      aqi: current.pollution.aqius,
      mainPollutant: current.pollution.mainus || 'Unknown',
      city: cityData.city || 'Unknown',
      country: cityData.country || 'Unknown',
      state: cityData.state || 'Unknown',
      source: 'iqair',
      timestamp: Date.now(),
      raw: data
    };
  } catch (error) {
    console.warn('IQAir API call failed:', error);
    return null;
  }
}

// Main air quality function
export async function getAirQualityData(lat: number, lon: number): Promise<AirQualityData | null> {
  return await fetchIQAirAQI(lat, lon);
}

// Get air quality by city name
export async function getAirQualityByCity(city: string): Promise<AirQualityData | null> {
  try {
    // Geocode the city to get coordinates
    const geo = await geocodeCity(city);
    if (!geo) {
      console.warn(`Could not geocode city: ${city}`);
      return null;
    }

    // Get air quality data using coordinates
    return await getAirQualityData(geo.lat, geo.lon);
  } catch (error) {
    console.warn(`Failed to get air quality for city ${city}:`, error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function getAirQualityByCoordsIQAir(lat: number, lon: number): Promise<IQAirAQIResult> {
  const data = await getAirQualityData(lat, lon);
  
  if (!data) {
    throw new Error('No air quality data available from IQAir');
  }

  return {
    aqi: data.aqi,
    mainPollutant: data.mainPollutant,
    city: data.city,
    country: data.country,
    state: data.state,
    raw: data.raw
  };
}

// Utility function to get AQI description
export function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// Utility function to get AQI color
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return 'text-green-500';
  if (aqi <= 100) return 'text-yellow-500';
  if (aqi <= 150) return 'text-orange-500';
  if (aqi <= 200) return 'text-red-500';
  if (aqi <= 300) return 'text-purple-500';
  return 'text-red-800';
} 