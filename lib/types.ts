export interface UnifiedWeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  sourceBreakdown: Record<string, unknown>;
  // Add more fields as needed
}

export interface UnifiedDailyForecast {
  day: string; // e.g. 'Mon'
  high: number;
  low: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: number;
  precipitation?: number;
  uvIndex?: number;
  date: string; // ISO date string
  sourceBreakdown: Record<string, unknown>;
}

export type Unified5DayForecast = UnifiedDailyForecast[];

export interface UnifiedHourlyForecastItem {
  time: string; // ISO string or display time
  temp: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  sourceBreakdown: Record<string, unknown>;
}

export type UnifiedHourlyForecast = UnifiedHourlyForecastItem[]; 