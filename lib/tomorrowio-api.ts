import axios from 'axios';
import { TOMORROWIO_API_KEY } from './env';

// Tomorrow.io API types
export interface TomorrowIOWeatherData {
  data: {
    time: string;
    values: {
      cloudBase: number;
      cloudCeiling: number;
      cloudCover: number;
      dewPoint: number;
      freezingRainIntensity: number;
      humidity: number;
      precipitationProbability: number;
      pressureSurfaceLevel: number;
      rainIntensity: number;
      sleetIntensity: number;
      snowIntensity: number;
      temperature: number;
      temperatureApparent: number;
      uvHealthConcern: number;
      uvIndex: number;
      visibility: number;
      weatherCode: number;
      windDirection: number;
      windGust: number;
      windSpeed: number;
    };
  }[];
  location: {
    lat: number;
    lon: number;
    name: string;
    type: string;
  };
}

export interface TomorrowIOForecastData {
  data: {
    time: string;
    values: {
      cloudBase: number;
      cloudCeiling: number;
      cloudCover: number;
      dewPoint: number;
      freezingRainIntensity: number;
      humidity: number;
      precipitationProbability: number;
      pressureSurfaceLevel: number;
      rainIntensity: number;
      sleetIntensity: number;
      snowIntensity: number;
      temperature: number;
      temperatureApparent: number;
      uvHealthConcern: number;
      uvIndex: number;
      visibility: number;
      weatherCode: number;
      windDirection: number;
      windGust: number;
      windSpeed: number;
    };
  }[];
  location: {
    lat: number;
    lon: number;
    name: string;
    type: string;
  };
}

export interface TomorrowIORealtimeData {
  data: {
    time: string;
    values: {
      cloudBase: number;
      cloudCeiling: number;
      cloudCover: number;
      dewPoint: number;
      freezingRainIntensity: number;
      humidity: number;
      precipitationProbability: number;
      pressureSurfaceLevel: number;
      rainIntensity: number;
      sleetIntensity: number;
      snowIntensity: number;
      temperature: number;
      temperatureApparent: number;
      uvHealthConcern: number;
      uvIndex: number;
      visibility: number;
      weatherCode: number;
      windDirection: number;
      windGust: number;
      windSpeed: number;
    };
  };
  location: {
    lat: number;
    lon: number;
    name: string;
    type: string;
  };
}

// Simple rate limiting for Tomorrow.io API
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_DAY = 1000; // Free tier limit

function checkRateLimit(): boolean {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Reset counter if a day has passed
  if (now - lastResetTime > dayInMs) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_DAY) {
    return false;
  }
  
  requestCount++;
  return true;
}

/**
 * Get real-time weather data from Tomorrow.io
 * Strength: Hyperlocal, real-time conditions with minute-by-minute precision
 */
export async function getTomorrowIORealtime(
  lat: number,
  lon: number
): Promise<TomorrowIORealtimeData | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/realtime`,
      {
        params: {
          location: `${lat},${lon}`,
          apikey: TOMORROWIO_API_KEY,
          units: 'metric',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io Realtime API error:', error);
    return null;
  }
}

/**
 * Get hourly forecast from Tomorrow.io
 * Strength: Detailed hourly predictions with precipitation intensity
 */
export async function getTomorrowIOHourlyForecast(
  lat: number,
  lon: number,
  hours: number = 24
): Promise<TomorrowIOWeatherData | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/forecast`,
      {
        params: {
          location: `${lat},${lon}`,
          timesteps: '1h',
          units: 'metric',
          apikey: TOMORROWIO_API_KEY,
        },
        timeout: 15000,
      }
    );

    // Limit to requested hours
    if (response.data.data) {
      response.data.data = response.data.data.slice(0, hours);
    }

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io Hourly Forecast API error:', error);
    return null;
  }
}

/**
 * Get daily forecast from Tomorrow.io
 * Strength: Extended daily forecasts with detailed parameters
 */
export async function getTomorrowIODailyForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<TomorrowIOWeatherData | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/forecast`,
      {
        params: {
          location: `${lat},${lon}`,
          timesteps: '1d',
          units: 'metric',
          apikey: TOMORROWIO_API_KEY,
        },
        timeout: 15000,
      }
    );

    // Limit to requested days
    if (response.data.data) {
      response.data.data = response.data.data.slice(0, days);
    }

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io Daily Forecast API error:', error);
    return null;
  }
}

/**
 * Get minute-by-minute precipitation forecast
 * Strength: Ultra-precise precipitation timing and intensity
 */
export async function getTomorrowIOMinuteForecast(
  lat: number,
  lon: number,
  minutes: number = 60
): Promise<TomorrowIOWeatherData | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/forecast`,
      {
        params: {
          location: `${lat},${lon}`,
          timesteps: '1m',
          units: 'metric',
          apikey: TOMORROWIO_API_KEY,
        },
        timeout: 15000,
      }
    );

    // Limit to requested minutes
    if (response.data.data) {
      response.data.data = response.data.data.slice(0, minutes);
    }

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io Minute Forecast API error:', error);
    return null;
  }
}

/**
 * Get weather alerts and severe weather information
 * Strength: Real-time alerts and severe weather detection
 */
export async function getTomorrowIOAlerts(
  lat: number,
  lon: number
): Promise<{ data: unknown[] } | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/alerts`,
      {
        params: {
          location: `${lat},${lon}`,
          apikey: TOMORROWIO_API_KEY,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io Alerts API error:', error);
    return null;
  }
}

/**
 * Get current weather by city name (with geocoding)
 * Strength: Easy city-based queries with automatic geocoding
 */
export async function getTomorrowIOWeatherByCity(
  city: string
): Promise<TomorrowIORealtimeData | null> {
  if (!TOMORROWIO_API_KEY) {
    console.warn('Tomorrow.io API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Tomorrow.io API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.tomorrow.io/v4/weather/realtime`,
      {
        params: {
          location: city,
          apikey: TOMORROWIO_API_KEY,
          units: 'metric',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Tomorrow.io City Weather API error:', error);
    return null;
  }
} 