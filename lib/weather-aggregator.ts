import { accuWeatherAPI, WeatherData } from './accuweather-api';
import { getWeatherByCity, get5DayForecastByCity, OWMWeather, OWMForecast } from './openweathermap-api';
import { UnifiedWeatherData, Unified5DayForecast, UnifiedHourlyForecast } from './types';

// Enhanced type definitions for better type safety
interface WeatherSource {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  source: string;
  timestamp: number;
  raw: unknown;
}

interface ForecastSource {
  date: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: number;
  precipitation?: number;
  source: string;
  raw: unknown;
}

interface HourlySource {
  time: string;
  temp: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  source: string;
  raw: unknown;
}

// Utility functions for data normalization
function normalizeCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    // OpenWeatherMap conditions
    'Clear': 'Clear',
    'Clouds': 'Cloudy',
    'Rain': 'Rainy',
    'Snow': 'Snowy',
    'Thunderstorm': 'Storm',
    'Drizzle': 'Rainy',
    'Mist': 'Foggy',
    'Smoke': 'Foggy',
    'Haze': 'Hazy',
    'Dust': 'Hazy',
    'Fog': 'Foggy',
    'Sand': 'Hazy',
    'Ash': 'Hazy',
    'Squall': 'Windy',
    'Tornado': 'Storm',
    
    // AccuWeather conditions (common patterns)
    'sunny': 'Clear',
    'mostly sunny': 'Clear',
    'partly sunny': 'Clear',
    'cloudy': 'Cloudy',
    'mostly cloudy': 'Cloudy',
    'partly cloudy': 'Cloudy',
    'overcast': 'Cloudy',
    'rain': 'Rainy',
    'rainy': 'Rainy',
    'showers': 'Rainy',
    'snow': 'Snowy',
    'snowy': 'Snowy',
    'storm': 'Storm',
    'thunderstorm': 'Storm',
    'fog': 'Foggy',
    'foggy': 'Foggy',
    'haze': 'Hazy',
    'hazy': 'Hazy',
    'windy': 'Windy',
  };

  const normalized = condition.toLowerCase().trim();
  return conditionMap[normalized] || condition;
}

function getMostCommonCondition(conditions: string[]): string {
  const counts: Record<string, number> = {};
  let maxCount = 0;
  let mostCommon = 'Unknown';

  for (const condition of conditions) {
    const normalized = normalizeCondition(condition);
    counts[normalized] = (counts[normalized] || 0) + 1;
    if (counts[normalized] > maxCount) {
      maxCount = counts[normalized];
      mostCommon = normalized;
    }
  }

  return mostCommon;
}

function averageValues(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

// Enhanced error handling wrapper
async function safeApiCall<T>(apiCall: () => Promise<T>, source: string): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.warn(`Failed to fetch data from ${source}:`, error);
    return null;
  }
}

// Normalize OpenWeatherMap current weather data
function normalizeOWMWeather(owmData: OWMWeather): WeatherSource {
  return {
    temperature: Math.round(owmData.main.temp),
    humidity: owmData.main.humidity,
    windSpeed: Math.round(owmData.wind.speed * 3.6), // Convert m/s to km/h
    condition: normalizeCondition(owmData.weather[0]?.main || 'Unknown'),
    source: 'openweathermap',
    timestamp: owmData.dt * 1000,
    raw: owmData,
  };
}

// Normalize AccuWeather current weather data
function normalizeAccuWeather(accuData: WeatherData): WeatherSource {
  return {
    temperature: Math.round(accuData.temperature),
    humidity: accuData.humidity,
    windSpeed: Math.round(accuData.windSpeed),
    condition: normalizeCondition(accuData.condition),
    source: 'accuweather',
    timestamp: Date.now(),
    raw: accuData,
  };
}

// Normalize OpenWeatherMap forecast data
function normalizeOWMForecast(owmData: OWMForecast): ForecastSource[] {
  const days: { [date: string]: OWMForecast['list'] } = {};
  
  // Group forecast items by date
  owmData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
  });

  // Exclude today and get next 5 days
  const today = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(days)
    .filter(date => date !== today)
    .sort()
    .slice(0, 5);

  return sortedDates.map(date => {
    const items = days[date];
    const conditions = items.map(item => item.weather[0]?.main || 'Unknown');
    
    // Calculate additional weather metrics
    const humidities = items.map(item => item.main.humidity);
    const windSpeeds = items.map(item => item.wind.speed * 3.6); // Convert m/s to km/h
    const feelsLike = items.map(item => item.main.feels_like || item.main.temp);
    
    // Get precipitation data (if available)
    const precipitation = items.map(item => item.rain?.['3h'] || item.snow?.['3h'] || 0);
    
    return {
      date,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      high: Math.round(Math.max(...items.map(item => item.main.temp_max))),
      low: Math.round(Math.min(...items.map(item => item.main.temp_min))),
      condition: getMostCommonCondition(conditions),
      description: items[0]?.weather[0]?.description,
      humidity: Math.round(averageValues(humidities)),
      windSpeed: Math.round(averageValues(windSpeeds)),
      feelsLike: Math.round(averageValues(feelsLike)),
      precipitation: Math.round(averageValues(precipitation) * 100) / 100, // Keep 2 decimal places
      source: 'openweathermap',
      raw: items,
    };
  });
}

// Normalize AccuWeather forecast data
function normalizeAccuForecast(accuData: WeatherData): ForecastSource[] {
  return accuData.forecast.slice(0, 5).map((day) => ({
    date: day.date,
    day: day.day,
    high: Math.round(day.high),
    low: Math.round(day.low),
    condition: normalizeCondition(day.condition),
    description: day.condition,
    source: 'accuweather',
    raw: day,
  }));
}

// Main unified weather data function
export async function getUnifiedWeatherData(city: string): Promise<UnifiedWeatherData> {
  const [accuResult, owmResult] = await Promise.allSettled([
    safeApiCall(() => accuWeatherAPI.getWeatherData(city), 'AccuWeather'),
    safeApiCall(() => getWeatherByCity(city), 'OpenWeatherMap'),
  ]);

  const sources: WeatherSource[] = [];

  if (accuResult.status === 'fulfilled' && accuResult.value) {
    sources.push(normalizeAccuWeather(accuResult.value));
  }

  if (owmResult.status === 'fulfilled' && owmResult.value) {
    sources.push(normalizeOWMWeather(owmResult.value));
  }

  if (sources.length === 0) {
    throw new Error('No weather data available from any source');
  }

  // Aggregate data
  const temperatures = sources.map(s => s.temperature);
  const humidities = sources.map(s => s.humidity);
  const windSpeeds = sources.map(s => s.windSpeed);
  const conditions = sources.map(s => s.condition);

  return {
    temperature: averageValues(temperatures),
    humidity: averageValues(humidities),
    windSpeed: averageValues(windSpeeds),
    condition: getMostCommonCondition(conditions),
    sourceBreakdown: Object.fromEntries(sources.map(s => [s.source, s.raw])),
  };
}

// Main unified 5-day forecast function
export async function getUnified5DayForecast(city: string): Promise<Unified5DayForecast> {
  const [accuResult, owmResult] = await Promise.allSettled([
    safeApiCall(() => accuWeatherAPI.getWeatherData(city), 'AccuWeather'),
    safeApiCall(() => get5DayForecastByCity(city), 'OpenWeatherMap'),
  ]);

  const sources: ForecastSource[] = [];

  if (accuResult.status === 'fulfilled' && accuResult.value) {
    sources.push(...normalizeAccuForecast(accuResult.value));
  }

  if (owmResult.status === 'fulfilled' && owmResult.value) {
    sources.push(...normalizeOWMForecast(owmResult.value));
  }

  if (sources.length === 0) {
    throw new Error('No forecast data available from any source');
  }

  // Group by date and aggregate
  const dateGroups: { [date: string]: ForecastSource[] } = {};
  sources.forEach(source => {
    if (!dateGroups[source.date]) dateGroups[source.date] = [];
    dateGroups[source.date].push(source);
  });

  const result: Unified5DayForecast = Object.entries(dateGroups).map(([date, dateSources]) => {
    if (dateSources.length === 1) {
      const source = dateSources[0];
      return {
        day: source.day,
        high: source.high,
        low: source.low,
        condition: source.condition,
        description: source.description,
        humidity: source.humidity,
        windSpeed: source.windSpeed,
        feelsLike: source.feelsLike,
        precipitation: source.precipitation,
        date: source.date,
        sourceBreakdown: { [source.source]: source.raw },
      };
    }

    // Aggregate multiple sources for the same date
    const highs = dateSources.map(s => s.high);
    const lows = dateSources.map(s => s.low);
    const conditions = dateSources.map(s => s.condition);
    const descriptions = dateSources.map(s => s.description).filter((desc): desc is string => Boolean(desc));
    const humidities = dateSources.map(s => s.humidity).filter((h): h is number => h !== undefined);
    const windSpeeds = dateSources.map(s => s.windSpeed).filter((w): w is number => w !== undefined);
    const feelsLike = dateSources.map(s => s.feelsLike).filter((f): f is number => f !== undefined);
    const precipitation = dateSources.map(s => s.precipitation).filter((p): p is number => p !== undefined);

    return {
      day: dateSources[0].day,
      high: averageValues(highs),
      low: averageValues(lows),
      condition: getMostCommonCondition(conditions),
      description: descriptions[0] || '',
      humidity: humidities.length > 0 ? averageValues(humidities) : undefined,
      windSpeed: windSpeeds.length > 0 ? averageValues(windSpeeds) : undefined,
      feelsLike: feelsLike.length > 0 ? averageValues(feelsLike) : undefined,
      precipitation: precipitation.length > 0 ? averageValues(precipitation) : undefined,
      date,
      sourceBreakdown: Object.fromEntries(dateSources.map(s => [s.source, s.raw])),
    };
  });

  // Sort by date
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

// Main unified hourly forecast function
export async function getUnifiedHourlyForecast(city: string): Promise<UnifiedHourlyForecast> {
  // Get AccuWeather location key
  let locationKey: string | null = null;
  try {
    const locations = await accuWeatherAPI.searchLocation(city);
    if (locations.length > 0) {
      locationKey = locations[0].Key;
    }
  } catch (error) {
    console.warn('Failed to get AccuWeather location key:', error);
  }

  const [accuResult, owmResult] = await Promise.allSettled([
    safeApiCall(() => locationKey ? accuWeatherAPI.getHourlyForecast(locationKey!) : Promise.resolve([]), 'AccuWeather'),
    safeApiCall(() => get5DayForecastByCity(city), 'OpenWeatherMap'),
  ]);

  const sources: HourlySource[] = [];

  // Process AccuWeather hourly data
  if (accuResult.status === 'fulfilled' && accuResult.value && Array.isArray(accuResult.value)) {
    accuResult.value.forEach(hour => {
      sources.push({
        time: hour.DateTime,
        temp: Math.round(hour.Temperature.Value),
        humidity: hour.RelativeHumidity,
        windSpeed: hour.Wind?.Speed?.Value ? Math.round(hour.Wind.Speed.Value * 1.60934) : undefined, // Convert mph to km/h
        condition: normalizeCondition(hour.IconPhrase),
        source: 'accuweather',
        raw: hour,
      });
    });
  }

  // Process OpenWeatherMap hourly data
  if (owmResult.status === 'fulfilled' && owmResult.value && Array.isArray(owmResult.value.list)) {
    owmResult.value.list.forEach(item => {
      sources.push({
        time: item.dt_txt,
        temp: Math.round(item.main.temp),
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
        condition: normalizeCondition(item.weather[0]?.main || 'Unknown'),
        source: 'openweathermap',
        raw: item,
      });
    });
  }

  if (sources.length === 0) {
    throw new Error('No hourly forecast data available from any source');
  }

  // Group by time and aggregate
  const timeGroups: { [time: string]: HourlySource[] } = {};
  sources.forEach(source => {
    if (!timeGroups[source.time]) timeGroups[source.time] = [];
    timeGroups[source.time].push(source);
  });

  const result: UnifiedHourlyForecast = Object.entries(timeGroups).map(([time, timeSources]) => {
    if (timeSources.length === 1) {
      const source = timeSources[0];
      return {
        time: source.time,
        temp: source.temp,
        humidity: source.humidity,
        windSpeed: source.windSpeed,
        condition: source.condition,
        sourceBreakdown: { [source.source]: source.raw },
      };
    }

    // Aggregate multiple sources for the same time
    const temps = timeSources.map(s => s.temp);
    const humidities = timeSources.map(s => s.humidity).filter((h): h is number => h !== undefined);
    const windSpeeds = timeSources.map(s => s.windSpeed).filter((w): w is number => w !== undefined);
    const conditions = timeSources.map(s => s.condition).filter((c): c is string => Boolean(c));

    return {
      time,
      temp: averageValues(temps),
      humidity: humidities.length > 0 ? averageValues(humidities) : undefined,
      windSpeed: windSpeeds.length > 0 ? averageValues(windSpeeds) : undefined,
      condition: getMostCommonCondition(conditions),
      sourceBreakdown: Object.fromEntries(timeSources.map(s => [s.source, s.raw])),
    };
  });

  // Sort by time
  result.sort((a, b) => a.time.localeCompare(b.time));
  return result;
} 