import axios from 'axios';
import { VISUALCROSSING_API_KEY } from './env';

// Visual Crossing API types
export interface VisualCrossingWeatherData {
  queryCost: number;
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  days: VisualCrossingDay[];
  currentConditions: VisualCrossingCurrentConditions;
}

export interface VisualCrossingCurrentConditions {
  datetime: string;
  datetimeEpoch: number;
  temp: number;
  feelslike: number;
  humidity: number;
  dew: number;
  precip: number;
  precipprob: number;
  snow: number;
  snowdepth: number;
  preciptype: string[] | null;
  windgust: number;
  windspeed: number;
  winddir: number;
  pressure: number;
  visibility: number;
  cloudcover: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  conditions: string;
  icon: string;
  stations: string[];
  source: string;
}

export interface VisualCrossingDay {
  datetime: string;
  datetimeEpoch: number;
  tempmax: number;
  tempmin: number;
  temp: number;
  feelslikemax: number;
  feelslikemin: number;
  feelslike: number;
  dew: number;
  humidity: number;
  precip: number;
  precipprob: number;
  precipcover: number;
  preciptype: string[] | null;
  snow: number;
  snowdepth: number;
  windgust: number;
  windspeed: number;
  winddir: number;
  pressure: number;
  cloudcover: number;
  visibility: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  conditions: string;
  description: string;
  icon: string;
  stations: string[] | null;
  source: string;
}

export interface VisualCrossingHistoricalData {
  queryCost: number;
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  days: VisualCrossingDay[];
}

// Simple rate limiting for Visual Crossing API
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
 * Get current weather data from Visual Crossing
 * Strength: Reliable current conditions with detailed parameters
 */
export async function getVisualCrossingCurrentWeather(
  city: string
): Promise<VisualCrossingWeatherData | null> {
  if (!VISUALCROSSING_API_KEY) {
    console.warn('Visual Crossing API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Visual Crossing API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
        city
      )}/today`,
      {
        params: {
          unitGroup: 'metric',
          include: 'current',
          key: VISUALCROSSING_API_KEY,
          contentType: 'json',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Visual Crossing API error:', error);
    return null;
  }
}

/**
 * Get historical weather data from Visual Crossing
 * Strength: Excellent historical data for trends and analysis
 */
export async function getVisualCrossingHistoricalData(
  city: string,
  startDate: string,
  endDate: string
): Promise<VisualCrossingHistoricalData | null> {
  if (!VISUALCROSSING_API_KEY) {
    console.warn('Visual Crossing API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Visual Crossing API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
        city
      )}/${startDate}/${endDate}`,
      {
        params: {
          unitGroup: 'metric',
          include: 'days',
          key: VISUALCROSSING_API_KEY,
          contentType: 'json',
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Visual Crossing Historical API error:', error);
    return null;
  }
}

/**
 * Get 15-day forecast from Visual Crossing
 * Strength: Extended forecast with detailed parameters
 */
export async function getVisualCrossingForecast(
  city: string,
  days: number = 15
): Promise<VisualCrossingWeatherData | null> {
  if (!VISUALCROSSING_API_KEY) {
    console.warn('Visual Crossing API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('Visual Crossing API rate limit exceeded');
    return null;
  }

  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    const response = await axios.get(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
        city
      )}/today/${endDateStr}`,
      {
        params: {
          unitGroup: 'metric',
          include: 'days',
          key: VISUALCROSSING_API_KEY,
          contentType: 'json',
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Visual Crossing Forecast API error:', error);
    return null;
  }
}

/**
 * Get weather trends and statistics
 * Strength: Historical analysis for weather patterns
 */
export async function getVisualCrossingTrends(
  city: string,
  days: number = 30
): Promise<{
  averageTemp: number;
  averageHumidity: number;
  totalPrecipitation: number;
  sunnyDays: number;
  rainyDays: number;
  data: VisualCrossingDay[];
} | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const historicalData = await getVisualCrossingHistoricalData(
    city,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );

  if (!historicalData || !historicalData.days.length) {
    return null;
  }

  const daysData = historicalData.days;
  const averageTemp = daysData.reduce((sum, day) => sum + day.temp, 0) / daysData.length;
  const averageHumidity = daysData.reduce((sum, day) => sum + day.humidity, 0) / daysData.length;
  const totalPrecipitation = daysData.reduce((sum, day) => sum + day.precip, 0);
  const sunnyDays = daysData.filter(day => 
    day.conditions.toLowerCase().includes('clear') || 
    day.conditions.toLowerCase().includes('sunny')
  ).length;
  const rainyDays = daysData.filter(day => 
    day.conditions.toLowerCase().includes('rain') || 
    day.conditions.toLowerCase().includes('shower')
  ).length;

  return {
    averageTemp: Math.round(averageTemp * 10) / 10,
    averageHumidity: Math.round(averageHumidity),
    totalPrecipitation: Math.round(totalPrecipitation * 100) / 100,
    sunnyDays,
    rainyDays,
    data: daysData,
  };
} 