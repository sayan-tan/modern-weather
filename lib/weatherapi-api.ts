import axios from 'axios';
import { WEATHERAPI_API_KEY } from './env';

// WeatherAPI.com types
export interface WeatherAPICurrentData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
}

export interface WeatherAPIForecastData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
  forecast: {
    forecastday: WeatherAPIForecastDay[];
  };
}

export interface WeatherAPIForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    maxwind_mph: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    totalprecip_in: number;
    totalsnow_cm: number;
    avgvis_km: number;
    avgvis_miles: number;
    avghumidity: number;
    daily_will_it_rain: number;
    daily_chance_of_rain: number;
    daily_will_it_snow: number;
    daily_chance_of_snow: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: string;
    moon_illumination: number;
    is_moon_up: number;
    is_sun_up: number;
  };
  hour: WeatherAPIHourData[];
}

export interface WeatherAPIHourData {
  time_epoch: number;
  time: string;
  temp_c: number;
  temp_f: number;
  is_day: number;
  condition: {
    text: string;
    icon: string;
    code: number;
  };
  wind_mph: number;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  pressure_mb: number;
  pressure_in: number;
  precip_mm: number;
  precip_in: number;
  humidity: number;
  cloud: number;
  feelslike_c: number;
  feelslike_f: number;
  windchill_c: number;
  windchill_f: number;
  heatindex_c: number;
  heatindex_f: number;
  dewpoint_c: number;
  dewpoint_f: number;
  will_it_rain: number;
  chance_of_rain: number;
  will_it_snow: number;
  chance_of_snow: number;
  vis_km: number;
  vis_miles: number;
  gust_mph: number;
  gust_kph: number;
  uv: number;
}

export interface WeatherAPIAstronomyData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  astronomy: {
    astro: {
      sunrise: string;
      sunset: string;
      moonrise: string;
      moonset: string;
      moon_phase: string;
      moon_illumination: number;
    };
  };
}

export interface WeatherAPIAlertsData {
  alerts: {
    alert: Array<{
      headline: string;
      msgtype: string;
      severity: string;
      urgency: string;
      areas: string;
      category: string;
      certainty: string;
      event: string;
      note: string;
      effective: string;
      expires: string;
      desc: string;
      instruction: string;
    }>;
  };
}

// Simple rate limiting for WeatherAPI.com
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MONTH = 1000000; // Free tier limit

function checkRateLimit(): boolean {
  const now = Date.now();
  const monthInMs = 30 * 24 * 60 * 60 * 1000;
  
  // Reset counter if a month has passed
  if (now - lastResetTime > monthInMs) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_MONTH) {
    return false;
  }
  
  requestCount++;
  return true;
}

/**
 * Get current weather data from WeatherAPI.com
 * Strength: Comprehensive current conditions with detailed parameters
 */
export async function getWeatherAPICurrent(
  city: string
): Promise<WeatherAPICurrentData | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
          aqi: 'no',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Current API error:', error);
    return null;
  }
}

/**
 * Get 3-day forecast from WeatherAPI.com
 * Strength: Detailed 3-day forecast with hourly breakdowns
 */
export async function getWeatherAPIForecast(
  city: string,
  days: number = 3
): Promise<WeatherAPIForecastData | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/forecast.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
          days: Math.min(days, 3), // Max 3 days for free tier
          aqi: 'no',
          alerts: 'yes',
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Forecast API error:', error);
    return null;
  }
}

/**
 * Get astronomy data from WeatherAPI.com
 * Strength: Sunrise, sunset, moon phases, and astronomical data
 */
export async function getWeatherAPIAstronomy(
  city: string,
  date: string
): Promise<WeatherAPIAstronomyData | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/astronomy.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
          dt: date,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Astronomy API error:', error);
    return null;
  }
}

/**
 * Get weather alerts from WeatherAPI.com
 * Strength: Comprehensive weather alerts and warnings
 */
export async function getWeatherAPIAlerts(
  city: string
): Promise<WeatherAPIAlertsData | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/forecast.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
          days: 1,
          aqi: 'no',
          alerts: 'yes',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Alerts API error:', error);
    return null;
  }
}

/**
 * Get marine weather data from WeatherAPI.com
 * Strength: Marine-specific weather conditions
 */
export async function getWeatherAPIMarine(
  city: string
): Promise<{ marine: unknown[] } | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/marine.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
          days: 3,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Marine API error:', error);
    return null;
  }
}

/**
 * Get sports weather data from WeatherAPI.com
 * Strength: Weather conditions optimized for sports activities
 */
export async function getWeatherAPISports(
  city: string
): Promise<{ sports: unknown[] } | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/sports.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Sports API error:', error);
    return null;
  }
}

/**
 * Get timezone information from WeatherAPI.com
 * Strength: Accurate timezone data for any location
 */
export async function getWeatherAPITimezone(
  city: string
): Promise<{ location: { tz_id: string; localtime: string } } | null> {
  if (!WEATHERAPI_API_KEY) {
    console.warn('WeatherAPI.com API key not configured');
    return null;
  }

  if (!checkRateLimit()) {
    console.warn('WeatherAPI.com API rate limit exceeded');
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/timezone.json`,
      {
        params: {
          key: WEATHERAPI_API_KEY,
          q: city,
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('WeatherAPI.com Timezone API error:', error);
    return null;
  }
} 