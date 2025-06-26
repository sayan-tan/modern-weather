import axios from 'axios';
import { OPENWEATHERMAP_API_KEY } from './env';

const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export interface OWMGeocodeResult {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
}

export interface OWMWeather {
    coord: { lon: number; lat: number };
    weather: { main: string; description: string; icon: string }[];
    main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
    wind: { speed: number };
    visibility: number;
    dt: number;
    sys: { country: string; sunrise: number; sunset: number };
    clouds: { all: number };
    name: string;
}

export interface OWMForecastItem {
    dt: number;
    main: { 
        temp: number; 
        temp_min: number; 
        temp_max: number; 
        humidity: number;
        feels_like?: number;
    };
    weather: { main: string; description: string; icon: string }[];
    wind: { speed: number };
    rain?: { '3h': number };
    snow?: { '3h': number };
    dt_txt: string;
}

export interface OWMForecast {
    list: OWMForecastItem[];
    city: { name: string; country: string };
}

// Enhanced error handling wrapper
async function makeOWMRequest<T>(url: string, params: Record<string, string | number>): Promise<T> {
    if (!OPENWEATHERMAP_API_KEY) {
        throw new Error('OpenWeatherMap API key not configured. Please add OPENWEATHERMAP_API_KEY to your .env.local file.');
    }

    try {
        const response = await axios.get<T>(url, {
            params: {
                ...params,
                appid: OPENWEATHERMAP_API_KEY,
            },
            timeout: 10000, // 10 second timeout
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenWeatherMap API key. Please check your API key.');
            } else if (error.response?.status === 429) {
                throw new Error('OpenWeatherMap API rate limit exceeded. Please try again later.');
            } else if (error.response?.status === 404) {
                throw new Error('Location not found. Please check the city name.');
            } else {
                throw new Error(`OpenWeatherMap API request failed: ${error.response?.statusText || error.message}`);
            }
        }
        throw new Error('Failed to fetch weather data from OpenWeatherMap. Please check your internet connection.');
    }
}

// Enhanced geocoding with better city matching
export async function geocodeCity(city: string): Promise<OWMGeocodeResult | null> {
    if (!city.trim()) {
        throw new Error('City name cannot be empty');
    }

    try {
        const results = await makeOWMRequest<OWMGeocodeResult[]>(GEO_URL, {
            q: city.trim(),
            limit: 10,
        });

        if (!results || results.length === 0) {
            return null;
        }

        // Try to find an exact match first (case-insensitive)
        const exactMatch = results.find(
            (item) => item.name.toLowerCase() === city.toLowerCase()
        );
        if (exactMatch) {
            return exactMatch;
        }

        // Try to find a match that starts with the city name
        const startsWithMatch = results.find(
            (item) => item.name.toLowerCase().startsWith(city.toLowerCase())
        );
        if (startsWithMatch) {
            return startsWithMatch;
        }

        // Return the first result as fallback
        return results[0];
    } catch (error) {
        console.warn('Geocoding failed for city:', city, error);
        return null;
    }
}

// Enhanced current weather function
export async function getWeatherByCity(city: string): Promise<OWMWeather> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    return makeOWMRequest<OWMWeather>(WEATHER_URL, {
        lat: geo.lat,
        lon: geo.lon,
        units: 'metric',
    });
}

// Enhanced 5-day forecast function
export async function get5DayForecastByCity(city: string): Promise<OWMForecast> {
    const geo = await geocodeCity(city);
    if (!geo) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    return makeOWMRequest<OWMForecast>(FORECAST_URL, {
        lat: geo.lat,
        lon: geo.lon,
        units: 'metric',
    });
}

// Enhanced weather by coordinates function
export async function getWeatherByCoords(lat: number, lon: number): Promise<OWMWeather> {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates provided');
    }

    return makeOWMRequest<OWMWeather>(WEATHER_URL, {
        lat,
        lon,
        units: 'metric',
    });
}

// Enhanced forecast by coordinates function
export async function get5DayForecastByCoords(lat: number, lon: number): Promise<OWMForecast> {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates provided');
    }

    return makeOWMRequest<OWMForecast>(FORECAST_URL, {
        lat,
        lon,
        units: 'metric',
    });
} 