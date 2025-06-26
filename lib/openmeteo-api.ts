import axios from 'axios';
import { UnifiedWeatherData } from './types';

// Open-Meteo API endpoints
const BASE_URL = 'https://api.open-meteo.com/v1';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';

// Open-Meteo doesn't require API keys, so no authentication needed

export interface OpenMeteoGeocodeResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string; // State/province
    admin2?: string; // County/district
    admin3?: string; // City/town
    population?: number;
}

export interface OpenMeteoGeocodeResponse {
    results?: OpenMeteoGeocodeResult[];
    generationtime_ms: number;
}

export interface OpenMeteoCurrentWeather {
    time: string;
    interval: number;
    temperature: number;
    windspeed: number;
    winddirection: number;
    is_day: number;
    weathercode: number;
    // Additional fields that may be present
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    rain?: number;
    showers?: number;
    snowfall?: number;
    cloud_cover?: number;
    pressure_msl?: number;
    surface_pressure?: number;
    wind_gusts_10m?: number;
}

export interface OpenMeteoHourlyData {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    snowfall: number[];
    weather_code: number[];
    pressure_msl: number[];
    surface_pressure: number[];
    cloud_cover: number[];
    cloud_cover_low: number[];
    cloud_cover_mid: number[];
    cloud_cover_high: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
    uv_index_clear_sky: number[];
    is_day: number[];
    sunshine_duration: number[];
    shortwave_radiation: number[];
    direct_radiation: number[];
    diffuse_radiation: number[];
    terrestrial_radiation: number[];
}

export interface OpenMeteoDailyData {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration: number[];
    sunshine_duration: number[];
    uv_index_max: number[];
    uv_index_clear_sky_max: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    showers_sum: number[];
    snowfall_sum: number[];
    precipitation_hours: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
    shortwave_radiation_sum: number[];
    et0_fao_evapotranspiration: number[];
}

export interface OpenMeteoWeatherResponse {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    current_weather?: OpenMeteoCurrentWeather;
    current?: {
        time: string;
        interval: number;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        precipitation: number;
        rain: number;
        showers: number;
        snowfall: number;
        weather_code: number;
        cloud_cover: number;
        pressure_msl: number;
        surface_pressure: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        wind_gusts_10m: number;
    };
    hourly?: OpenMeteoHourlyData;
    daily?: OpenMeteoDailyData;
    hourly_units?: Record<string, string>;
    daily_units?: Record<string, string>;
}

// Weather code mapping to human-readable conditions
export const WEATHER_CODES: Record<number, { condition: string; description: string }> = {
    0: { condition: 'Clear', description: 'Clear sky' },
    1: { condition: 'Partly Cloudy', description: 'Mainly clear' },
    2: { condition: 'Partly Cloudy', description: 'Partly cloudy' },
    3: { condition: 'Overcast', description: 'Overcast' },
    45: { condition: 'Foggy', description: 'Foggy' },
    48: { condition: 'Foggy', description: 'Depositing rime fog' },
    51: { condition: 'Drizzle', description: 'Light drizzle' },
    53: { condition: 'Drizzle', description: 'Moderate drizzle' },
    55: { condition: 'Drizzle', description: 'Dense drizzle' },
    56: { condition: 'Freezing Drizzle', description: 'Light freezing drizzle' },
    57: { condition: 'Freezing Drizzle', description: 'Dense freezing drizzle' },
    61: { condition: 'Rain', description: 'Slight rain' },
    63: { condition: 'Rain', description: 'Moderate rain' },
    65: { condition: 'Rain', description: 'Heavy rain' },
    66: { condition: 'Freezing Rain', description: 'Light freezing rain' },
    67: { condition: 'Freezing Rain', description: 'Heavy freezing rain' },
    71: { condition: 'Snow', description: 'Slight snow fall' },
    73: { condition: 'Snow', description: 'Moderate snow fall' },
    75: { condition: 'Snow', description: 'Heavy snow fall' },
    77: { condition: 'Snow', description: 'Snow grains' },
    80: { condition: 'Rain Showers', description: 'Slight rain showers' },
    81: { condition: 'Rain Showers', description: 'Moderate rain showers' },
    82: { condition: 'Rain Showers', description: 'Violent rain showers' },
    85: { condition: 'Snow Showers', description: 'Slight snow showers' },
    86: { condition: 'Snow Showers', description: 'Heavy snow showers' },
    95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
    96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
    99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
};

// Enhanced error handling wrapper
async function makeOpenMeteoRequest<T>(url: string, params: Record<string, string | number | boolean>): Promise<T> {
    try {
        const response = await axios.get<T>(url, {
            params,
            timeout: 10000, // 10 second timeout
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400) {
                throw new Error('Invalid request parameters. Please check your input.');
            } else if (error.response?.status === 429) {
                throw new Error('Open-Meteo API rate limit exceeded. Please try again later.');
            } else if (error.response?.status === 404) {
                throw new Error('Location not found. Please check the coordinates or city name.');
            } else {
                throw new Error(`Open-Meteo API request failed: ${error.response?.statusText || error.message}`);
            }
        }
        throw new Error('Failed to fetch weather data from Open-Meteo. Please check your internet connection.');
    }
}

// Geocoding function
export async function geocodeCity(city: string): Promise<OpenMeteoGeocodeResult | null> {
    if (!city.trim()) {
        throw new Error('City name cannot be empty');
    }

    try {
        const response = await makeOpenMeteoRequest<OpenMeteoGeocodeResponse>(GEOCODING_URL + '/search', {
            name: city.trim(),
            count: 10,
            language: 'en',
            format: 'json',
        });

        if (!response.results || response.results.length === 0) {
            return null;
        }

        // Try to find an exact match first (case-insensitive)
        const exactMatch = response.results.find(
            (item) => item.name.toLowerCase() === city.toLowerCase()
        );
        if (exactMatch) {
            return exactMatch;
        }

        // Try to find a match that starts with the city name
        const startsWithMatch = response.results.find(
            (item) => item.name.toLowerCase().startsWith(city.toLowerCase())
        );
        if (startsWithMatch) {
            return startsWithMatch;
        }

        // Return the first result as fallback
        return response.results[0];
    } catch (error) {
        console.warn('Geocoding failed for city:', city, error);
        return null;
    }
}

// Get current weather by city
export async function getCurrentWeatherByCity(city: string): Promise<OpenMeteoWeatherResponse> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    return makeOpenMeteoRequest<OpenMeteoWeatherResponse>(BASE_URL + '/forecast', {
        latitude: geo.latitude,
        longitude: geo.longitude,
        current_weather: true,
        timezone: 'auto',
    });
}

// Get hourly forecast by city
export async function getHourlyForecastByCity(
    city: string, 
    days: number = 7,
    hourly: string[] = ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'precipitation_probability', 'precipitation', 'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'is_day']
): Promise<OpenMeteoWeatherResponse> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    return makeOpenMeteoRequest<OpenMeteoWeatherResponse>(BASE_URL + '/forecast', {
        latitude: geo.latitude,
        longitude: geo.longitude,
        hourly: hourly.join(','),
        forecast_days: days,
        timezone: 'auto',
    });
}

// Get daily forecast by city
export async function getDailyForecastByCity(
    city: string,
    days: number = 7,
    daily: string[] = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max', 'apparent_temperature_min', 'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max', 'uv_index_max']
): Promise<OpenMeteoWeatherResponse> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    return makeOpenMeteoRequest<OpenMeteoWeatherResponse>(BASE_URL + '/forecast', {
        latitude: geo.latitude,
        longitude: geo.longitude,
        daily: daily.join(','),
        forecast_days: days,
        timezone: 'auto',
    });
}

// Get comprehensive weather data by city (current + hourly + daily)
export async function getComprehensiveWeatherByCity(
    city: string,
    days: number = 7
): Promise<OpenMeteoWeatherResponse> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    const hourlyParams = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 
        'precipitation_probability', 'precipitation', 'weather_code', 
        'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'is_day',
        'cloud_cover', 'pressure_msl', 'visibility'
    ];

    const dailyParams = [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 
        'apparent_temperature_max', 'apparent_temperature_min', 
        'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max', 
        'wind_speed_10m_max', 'wind_gusts_10m_max', 'uv_index_max',
        'sunshine_duration', 'daylight_duration'
    ];

    return makeOpenMeteoRequest<OpenMeteoWeatherResponse>(BASE_URL + '/forecast', {
        latitude: geo.latitude,
        longitude: geo.longitude,
        current_weather: true,
        hourly: hourlyParams.join(','),
        daily: dailyParams.join(','),
        forecast_days: days,
        timezone: 'auto',
    });
}

// Get weather by coordinates
export async function getWeatherByCoords(
    lat: number, 
    lon: number,
    days: number = 7
): Promise<OpenMeteoWeatherResponse> {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates provided');
    }

    const hourlyParams = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 
        'precipitation_probability', 'precipitation', 'weather_code', 
        'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'is_day'
    ];

    const dailyParams = [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 
        'apparent_temperature_max', 'apparent_temperature_min', 
        'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max', 
        'wind_speed_10m_max', 'wind_gusts_10m_max', 'uv_index_max'
    ];

    return makeOpenMeteoRequest<OpenMeteoWeatherResponse>(BASE_URL + '/forecast', {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: hourlyParams.join(','),
        daily: dailyParams.join(','),
        forecast_days: days,
        timezone: 'auto',
    });
}

// Helper function to get weather condition from code
export function getWeatherCondition(code: number): { condition: string; description: string } {
    return WEATHER_CODES[code] || { condition: 'Unknown', description: 'Unknown weather condition' };
}

// Helper function to convert Open-Meteo data to your unified format
export function convertToUnifiedWeatherData(data: OpenMeteoWeatherResponse): UnifiedWeatherData {
    if (!data.current_weather) {
        throw new Error('No current weather data available');
    }

    const weatherCode = data.current_weather.weathercode;
    const weatherInfo = getWeatherCondition(weatherCode);

    return {
        temperature: data.current_weather.temperature,
        humidity: data.current_weather.relative_humidity_2m || 0,
        windSpeed: data.current_weather.windspeed,
        condition: weatherInfo.condition,
        sourceBreakdown: {
            openmeteo: {
                weather_code: weatherCode,
                original_data: data.current_weather,
            },
        },
    };
} 