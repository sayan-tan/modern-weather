import axios from 'axios';
import { API_CONFIG, getApiKey } from '@/config/api';

// AccuWeather API interfaces
export interface AccuWeatherLocation {
  Key: string;
  LocalizedName: string;
  Country: {
    LocalizedName: string;
  };
  AdministrativeArea: {
    LocalizedName: string;
  };
}

export interface AccuWeatherCurrentConditions {
  LocalObservationDateTime: string;
  WeatherText: string;
  WeatherIcon: number;
  Temperature: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
  RelativeHumidity: number;
  Wind: {
    Speed: {
      Metric: {
        Value: number;
        Unit: string;
      };
      Imperial: {
        Value: number;
        Unit: string;
      };
    };
  };
  Visibility: {
    Metric: {
      Value: number;
      Unit: string;
    };
    Imperial: {
      Value: number;
      Unit: string;
    };
  };
  UVIndex: number;
  UVIndexText: string;
  IsDayTime: boolean;
}

export interface AccuWeatherForecast {
  Date: string;
  Temperature: {
    Minimum: {
      Value: number;
      Unit: string;
    };
    Maximum: {
      Value: number;
      Unit: string;
    };
  };
  Day: {
    Icon: number;
    IconPhrase: string;
  };
  Night: {
    Icon: number;
    IconPhrase: string;
  };
}

export interface AccuWeatherHourlyForecast {
  DateTime: string;
  Icon: number;
  IconPhrase: string;
  HasPrecipitation: boolean;
  PrecipitationType?: string;
  PrecipitationIntensity?: string;
  Temperature: {
    Value: number;
    Unit: string;
  };
  RelativeHumidity: number;
  Wind: {
    Speed: {
      Value: number;
      Unit: string;
    };
    Direction: {
      Degrees: number;
      Localized: string;
    };
  };
  UVIndex: number;
  UVIndexText: string;
  PrecipitationProbability: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  isDayTime: boolean;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    date: string;
  }>;
}

class AccuWeatherAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('AccuWeather API key not configured. Please add ACCUWEATHER_API_KEY to your .env.local file.');
    }

    try {
      const response = await axios.get<T>(`${API_CONFIG.baseURL}${endpoint}`, {
        params: {
          apikey: this.apiKey,
        },
        timeout: 10000, // 10 second timeout
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid AccuWeather API key. Please check your API key.');
        } else if (error.response?.status === 429) {
          throw new Error('AccuWeather API rate limit exceeded. Please try again later.');
        } else if (error.response?.status === 404) {
          throw new Error('Location not found. Please check the city name.');
        } else {
          throw new Error(`AccuWeather API request failed: ${error.response?.statusText || error.message}`);
        }
      }
      throw new Error('Failed to fetch weather data from AccuWeather. Please check your internet connection.');
    }
  }

  async searchLocation(query: string): Promise<AccuWeatherLocation[]> {
    if (!query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    const endpoint = `${API_CONFIG.endpoints.locationSearch}?q=${encodeURIComponent(query.trim())}`;
    return this.makeRequest<AccuWeatherLocation[]>(endpoint);
  }

  async getCurrentConditions(locationKey: string): Promise<AccuWeatherCurrentConditions[]> {
    if (!locationKey) {
      throw new Error('Location key is required');
    }

    const endpoint = `${API_CONFIG.endpoints.currentConditions}/${locationKey}`;
    return this.makeRequest<AccuWeatherCurrentConditions[]>(endpoint);
  }

  async get5DayForecast(locationKey: string): Promise<{ DailyForecasts: AccuWeatherForecast[] }> {
    if (!locationKey) {
      throw new Error('Location key is required');
    }

    const endpoint = `${API_CONFIG.endpoints.forecast}/${locationKey}`;
    return this.makeRequest<{ DailyForecasts: AccuWeatherForecast[] }>(endpoint);
  }

  async getWeatherData(cityName: string): Promise<WeatherData> {
    if (!cityName.trim()) {
      throw new Error('City name cannot be empty');
    }

    // First, search for the location
    const locations = await this.searchLocation(cityName);
    if (!locations.length) {
      throw new Error(`Location "${cityName}" not found. Please check the spelling and try again.`);
    }

    const location = locations[0];
    const locationKey = location.Key;

    // Get current conditions and forecast in parallel
    const [currentConditions, forecastData] = await Promise.all([
      this.getCurrentConditions(locationKey),
      this.get5DayForecast(locationKey),
    ]);

    if (!currentConditions.length) {
      throw new Error('No current weather conditions available for this location');
    }

    const current = currentConditions[0];
    const forecast = forecastData.DailyForecasts || [];

    // Map AccuWeather data to our interface
    const weatherData: WeatherData = {
      location: `${location.LocalizedName}, ${location.AdministrativeArea?.LocalizedName || location.Country.LocalizedName}`,
      temperature: current.Temperature?.Imperial?.Value ?? 0,
      condition: current.WeatherText ?? 'Unknown',
      humidity: current.RelativeHumidity ?? 0,
      windSpeed: current.Wind?.Speed?.Imperial?.Value ?? 0,
      visibility: current.Visibility?.Imperial?.Value ?? 0,
      uvIndex: current.UVIndex ?? 0,
      isDayTime: current.IsDayTime ?? true,
      forecast: forecast.slice(0, 5).map((day, index) => ({
        day: index === 0 ? 'Today' : new Date(day.Date).toLocaleDateString('en-US', { weekday: 'short' }),
        high: day.Temperature?.Maximum?.Value ?? 0,
        low: day.Temperature?.Minimum?.Value ?? 0,
        condition: this.mapWeatherIconToCondition(day.Day?.Icon ?? 1),
        date: day.Date,
      })),
    };

    return weatherData;
  }

  private mapWeatherIconToCondition(iconCode: number): string {
    // Enhanced mapping of AccuWeather icon codes to standardized conditions
    const iconMap: Record<number, string> = {
      // Clear/Sunny conditions
      1: 'sunny', 2: 'sunny', 3: 'sunny', 4: 'sunny', 5: 'sunny',
      // Cloudy conditions
      6: 'cloudy', 7: 'cloudy', 8: 'cloudy', 9: 'cloudy', 10: 'cloudy', 11: 'cloudy',
      // Rainy conditions
      12: 'rainy', 13: 'rainy', 14: 'rainy', 15: 'rainy', 16: 'rainy', 17: 'rainy', 18: 'rainy',
      // Snowy conditions
      19: 'snowy', 20: 'snowy', 21: 'snowy', 22: 'snowy', 23: 'snowy',
      // Drizzle conditions
      24: 'drizzle', 25: 'drizzle', 26: 'drizzle', 27: 'drizzle', 28: 'drizzle', 29: 'drizzle',
      // Night conditions
      30: 'night', 31: 'night', 32: 'night', 33: 'night', 34: 'night', 35: 'night',
      // Storm conditions
      36: 'storm', 37: 'storm', 38: 'storm', 39: 'storm', 40: 'storm', 41: 'storm', 42: 'storm', 43: 'storm', 44: 'storm',
      // Foggy conditions
      45: 'foggy', 46: 'foggy', 47: 'foggy', 48: 'foggy',
    };

    return iconMap[iconCode] || 'sunny';
  }

  async getHourlyForecast(locationKey: string): Promise<AccuWeatherHourlyForecast[]> {
    if (!locationKey) {
      throw new Error('Location key is required');
    }

    const endpoint = `${API_CONFIG.endpoints.hourlyForecast}/${locationKey}`;
    return this.makeRequest<AccuWeatherHourlyForecast[]>(endpoint);
  }
}

export const accuWeatherAPI = new AccuWeatherAPI(); 