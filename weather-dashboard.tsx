"use client"

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { UnifiedWeatherData, UnifiedDailyForecastArray, UnifiedHourlyForecast, UnifiedHourlyForecastItem } from "@/lib/types"
import { 
  getAirQualityColor,
  getAirQualityDescription,
  getWeatherAdvice,
  formatHumidity,
  formatWindSpeed,
  getWeatherBackground
} from "@/lib/weather-utils"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts'
import { WeatherIcon, WeatherBuddyIcon, SearchIcon, WindIcon, WikipediaIcon, getPollutantIcon } from "@/components/ui/weathericon"
import { ArrowDownLeft, ArrowUpRight } from 'iconoir-react'
import Image from "next/image"
import { format, parse } from "date-fns"
import TopCities from './components/TopCities'
import WeatherLoaderOverlay from "@/components/ui/WeatherLoaderOverlay"

export default function WeatherDashboard() {
  // Load selectedCity from localStorage on mount
  const [selectedCity, setSelectedCity] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("")
  const [unifiedWeather, setUnifiedWeather] = useState<UnifiedWeatherData | null>(null)
  const [unified5Day, setUnified5Day] = useState<UnifiedDailyForecastArray>([]);
  const [unifiedHourly, setUnifiedHourly] = useState<UnifiedHourlyForecast>([]);
  const [cityInfo, setCityInfo] = useState<Record<string, unknown> | null>(null);
  const [cityInfoLoading, setCityInfoLoading] = useState(false);
  const [cityInfoError, setCityInfoError] = useState<string | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [aqiMainPollutant, setAqiMainPollutant] = useState<string | null>(null);
  const [aqiLoading, setAqiLoading] = useState(false);
  const [aqiError, setAqiError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // New loading and error states for weather data
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Add state for showing detailed forecast
  const [showDetailedForecast, setShowDetailedForecast] = useState(false);

  // Add state for temperature unit
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Add state for forecast tabs
  const [selectedForecastDays, setSelectedForecastDays] = useState<5 | 10 | 15>(5);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Determine if any loading state is active
  const isLoading = weatherLoading || aqiLoading || cityInfoLoading || forecastLoading;

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    const savedCity = localStorage.getItem('selectedCity') || "";
    setSelectedCity(savedCity);
  }, []);

  // Save selectedCity to localStorage whenever it changes
  useEffect(() => {
    if (isClient && selectedCity) {
      localStorage.setItem('selectedCity', selectedCity);
    }
  }, [selectedCity, isClient]);

  // Helper to normalize city name (trim and title case)
  function normalizeCityName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  const fetchWeatherData = async (city: string) => {
    if (!city.trim()) return;
    
    setWeatherLoading(true);
    setWeatherError(null);
    setForecastLoading(true);

    try {
      // Use selectedForecastDays or default to 5
      const days = selectedForecastDays || 5;
      
      // Fetch current weather, forecast, and hourly data in parallel
      const [weatherRes, forecastRes, hourlyRes] = await Promise.all([
        fetch(`/api/weather?city=${encodeURIComponent(city)}`),
        fetch(`/api/forecast?city=${encodeURIComponent(city)}&days=${days}`),
        fetch(`/api/hourly?city=${encodeURIComponent(city)}&days=${days}`)
      ]);

      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.status}`);
      }
      if (!forecastRes.ok) {
        throw new Error(`Forecast API error: ${forecastRes.status}`);
      }
      if (!hourlyRes.ok) {
        throw new Error(`Hourly API error: ${hourlyRes.status}`);
      }

      const [weatherData, forecastData, hourlyData] = await Promise.all([
        weatherRes.json(),
        forecastRes.json(),
        hourlyRes.json()
      ]);

      setUnifiedWeather(weatherData);
      setUnified5Day(forecastData);
      setUnifiedHourly(hourlyData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setWeatherLoading(false);
      setForecastLoading(false);
    }
  };

  // Function to fetch forecast data with different day ranges
  const fetchForecastData = async (city: string, days: 5 | 10 | 15) => {
    setForecastLoading(true);
    try {
      // Fetch both forecast and hourly data for the new day range
      const [forecastRes, hourlyRes] = await Promise.all([
        fetch(`/api/forecast?city=${encodeURIComponent(city)}&days=${days}`),
        fetch(`/api/hourly?city=${encodeURIComponent(city)}&days=${days}`)
      ]);

      if (!forecastRes.ok) {
        throw new Error(`Forecast API error: ${forecastRes.status}`);
      }
      if (!hourlyRes.ok) {
        throw new Error(`Hourly API error: ${hourlyRes.status}`);
      }

      const [forecastData, hourlyData] = await Promise.all([
        forecastRes.json(),
        hourlyRes.json()
      ]);

      setUnified5Day(forecastData);
      setUnifiedHourly(hourlyData);
      setSelectedForecastDays(days);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setWeatherError(error instanceof Error ? error.message : 'Failed to fetch forecast data');
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCity) {
      fetchWeatherData(selectedCity);
    } else {
      setUnifiedWeather(null);
      setUnified5Day([]);
      setUnifiedHourly([]);
      setWeatherError(null);
    }
  }, [selectedCity, selectedForecastDays])

  // Fetch city info when selectedCity changes
  useEffect(() => {
    if (!selectedCity) {
      setCityInfo(null);
      setCityInfoError(null);
      return;
    }
    setCityInfoLoading(true);
    setCityInfoError(null);
    fetch(`/api/city-info?city=${encodeURIComponent(selectedCity)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setCityInfo(null);
          setCityInfoError(data.error);
        } else {
          setCityInfo(data);
        }
      })
      .catch(() => {
        setCityInfo(null);
        setCityInfoError('Failed to fetch city info');
      })
      .finally(() => setCityInfoLoading(false));
  }, [selectedCity]);

  // Fetch AQI when unified weather data changes
  useEffect(() => {
    if (!unifiedWeather || !selectedCity) {
      setAqi(null);
      setAqiMainPollutant(null);
      setAqiError(null);
      return;
    }
    
    setAqiLoading(true);
    setAqiError(null);
    
    // Get coordinates from the unified weather data if available
    const getCoordinates = async () => {
      try {
        // Try to get coordinates from the source breakdown
        const owmData = unifiedWeather.sourceBreakdown.openweathermap as { coord?: { lat: number; lon: number } };
        if (owmData?.coord) {
          return { lat: owmData.coord.lat, lon: owmData.coord.lon };
        }
        
        // Fallback to geocoding the city
        const geo = await fetch(`/api/geocode?city=${encodeURIComponent(selectedCity)}`);
        if (!geo.ok) throw new Error('No coordinates available');
        const data = await geo.json();
        if (data.error) throw new Error(data.error);
        return { lat: data.lat, lon: data.lon };
      } catch {
        throw new Error('Failed to get coordinates for AQI');
      }
    };

    getCoordinates()
      .then(({ lat, lon }) => fetch(`/api/air-quality?lat=${lat}&lon=${lon}`))
      .then(res => res.json())
      .then((data) => {
        if (data.error) {
          setAqi(null);
          setAqiMainPollutant(null);
          setAqiError(data.error);
        } else {
          setAqi(data.aqi);
          setAqiMainPollutant(data.mainPollutant);
          setAqiError(null);
        }
      })
      .catch((error) => {
        console.warn('AQI fetch failed:', error);
        setAqi(null);
        setAqiMainPollutant(null);
        setAqiError(error instanceof Error ? error.message : 'Failed to fetch AQI');
      })
      .finally(() => setAqiLoading(false));
  }, [unifiedWeather, selectedCity]);

  // Geolocation handler
  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setCityInfoError("Geolocation is not supported by your browser.");
      return;
    }
    setCityInfoLoading(true);
    setCityInfoError(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        // Optionally reverse geocode to get city name
        let cityName = `${latitude},${longitude}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.address && (data.address.city || data.address.town || data.address.village)) {
            cityName = data.address.city || data.address.town || data.address.village;
          } else if (data.display_name) {
            cityName = data.display_name.split(",")[0];
          }
        } catch {}
        setSelectedCity(cityName);
        setSearchQuery("");
      } catch {
        setCityInfoError("Failed to get your location's weather.");
      } finally {
        setCityInfoLoading(false);
      }
    }, () => {
      setCityInfoError("Unable to retrieve your location.");
      setCityInfoLoading(false);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const normalized = normalizeCityName(searchQuery);
      setSelectedCity(normalized);
      setSearchQuery("");
    }
  };

  // Helper to get selected day data
  const forecastSummaries = unified5Day;

  // Find today's index in the forecast
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayIndex = forecastSummaries.findIndex(day => day.date === todayDateStr) !== -1 ? forecastSummaries.findIndex(day => day.date === todayDateStr) : 0;

  // Determine which day to show: if forecast card is open, use selectedDayIndex, else use today
  const effectiveDayIndex = showDetailedForecast ? selectedDayIndex : todayIndex;
  const selectedDay = forecastSummaries[effectiveDayIndex];
  
  // Get all hourly items for the selected day - fix the date matching logic
  const selectedDayDate = selectedDay ? selectedDay.date : null;
  
  // Process hourly data based on forecast range
  const selectedDayHours = (() => {
    if (unifiedHourly.length === 0 || !selectedDayDate) return [];
    // Normalize selectedDayDate to YYYY-MM-DD
    const normalizedSelectedDay = selectedDayDate.slice(0, 10);
    // Always filter to the selected day
    const filteredData = unifiedHourly.filter(item => {
      // Normalize item date to YYYY-MM-DD
      const itemDate = item.time.split('T')[0].split(' ')[0];
      return itemDate === normalizedSelectedDay;
    });
    // For 10/15-day forecasts, downsample to every 2 hours
    if (selectedForecastDays > 5) {
      return filteredData.filter((_, idx) => idx % 2 === 0);
    }
    return filteredData;
  })();
  
  // Get the middle hour or first available hour for the selected day
  const selectedHour = selectedDayHours.length > 0 
    ? selectedDayHours[Math.floor(selectedDayHours.length / 2)] || selectedDayHours[0]
    : null;

  // Fallback to current weather data if no hourly data is available
  const displayWeather = selectedHour || unifiedWeather;

  // Helper function to get temperature from either data type
  const getTemperature = (weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null) => {
    if (!weather) return undefined;
    // UnifiedWeatherData uses 'temperature', UnifiedHourlyForecastItem uses 'temp'
    return 'temperature' in weather ? weather.temperature : weather.temp;
  };

  // Helper function to get humidity from either data type
  const getHumidity = (weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null) => {
    if (!weather) return undefined;
    return weather.humidity;
  };

  // Helper function to get wind speed from either data type
  const getWindSpeed = (weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null) => {
    if (!weather) return undefined;
    return weather.windSpeed;
  };

  // Helper: Map OpenMeteo weather codes to icon/condition
  function mapWeatherCodeToCondition(code: number): string {
    if (code === 0) return 'sun-light';
    if ([1, 2, 3].includes(code)) return 'cloud-sunny';
    if ([45, 48].includes(code)) return 'fog';
    if ([51, 53, 55, 56, 57, 61, 63].includes(code)) return 'rain';
    if ([65, 66, 67, 80, 81, 82].includes(code)) return 'heavy-rain';
    if ([71, 73, 75, 85, 86].includes(code)) return 'snow';
    if (code === 77) return 'snow-flake';
    if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
    return 'cloud'; // fallback to cloud if unknown
  }

  // Type guard to check if object is UnifiedWeatherData with OpenMeteo code
  function hasOpenMeteoCode(weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null): weather is UnifiedWeatherData {
    return !!weather &&
      typeof weather === 'object' &&
      'sourceBreakdown' in weather &&
      weather.sourceBreakdown !== undefined &&
      typeof weather.sourceBreakdown === 'object' &&
      'openmeteo' in weather.sourceBreakdown &&
      weather.sourceBreakdown.openmeteo !== undefined &&
      typeof weather.sourceBreakdown.openmeteo === 'object' &&
      'weather_code' in (weather.sourceBreakdown.openmeteo as { weather_code?: number }) &&
      typeof (weather.sourceBreakdown.openmeteo as { weather_code?: number }).weather_code === 'number';
  }

  // Helper function to get condition from either data type, prioritizing weather_code
  const getCondition = (weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null) => {
    if (!weather) return 'default';

    // 1. Use OpenMeteo weather_code if available
    if (hasOpenMeteoCode(weather)) {
      const openmeteo = weather.sourceBreakdown.openmeteo as { weather_code: number };
      return mapWeatherCodeToCondition(openmeteo.weather_code);
    }

    // 2. Fallback to string matching (improved)
    const condition = (weather.condition || '').toLowerCase();
    const description = ('description' in weather && typeof weather.description === 'string')
      ? weather.description.toLowerCase()
      : '';

    if (condition.includes('thunder') || description.includes('thunder')) return 'thunderstorm';
    if (condition.includes('hail') || description.includes('hail')) return 'hail';
    if (
      condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle') ||
      description.includes('rain') || description.includes('shower') || description.includes('drizzle')
    ) return 'rainy';
    if (condition.includes('snow') || description.includes('snow') || description.includes('sleet') || description.includes('blizzard')) return 'snowy';
    if (condition.includes('fog') || description.includes('fog') || description.includes('mist') || description.includes('haze')) return 'fog';
    if (condition.includes('wind') || description.includes('wind') || description.includes('breeze') || description.includes('gust')) return 'windy';
    if (condition.includes('cloud') || description.includes('cloud')) return 'cloudy';
    if (condition.includes('clear') || condition.includes('sunny') || description.includes('clear') || description.includes('sunny')) return 'sunny';

    return condition || 'default';
  };

  // When closing the forecast card, reset selectedDayIndex to today
  useEffect(() => {
    if (!showDetailedForecast && selectedDayIndex !== todayIndex) {
      setSelectedDayIndex(todayIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetailedForecast, todayIndex]);

  // Before rendering, determine the icon condition for the hero content
  const heroIconCondition = showDetailedForecast && selectedDay
    ? getForecastDayIcon(selectedDay)
    : getCondition(displayWeather);
  // Use heroIconCondition for the background image
  const bgImage = getWeatherBackground(heroIconCondition);

  // Helper to convert temperature
  function displayTemperature(tempC: number | undefined) {
    if (tempC === undefined) return 'N/A';
    if (tempUnit === 'C') return `${Math.round(tempC)}°C`;
    return `${Math.round(tempC * 9/5 + 32)}°F`;
  }

  // Helper to generate a descriptive summary for a forecast day
  function getForecastSummary(day: import("@/lib/types").UnifiedDailyForecast) {
    const parts: string[] = [];
    // Add high/low at the start
    parts.push(`High ${displayTemperature(day.high)}, low ${displayTemperature(day.low)}.`);
    if (day.description) {
      parts.push(day.description.charAt(0).toUpperCase() + day.description.slice(1) + (day.precipitation && day.precipitation > 0 ? ' expected' : '.'));
    }
    if (day.feelsLike !== undefined && Math.abs(day.feelsLike - day.high) > 1) {
      parts.push(`Feels like ${displayTemperature(day.feelsLike)}.`);
    }
    if (day.humidity !== undefined) parts.push(`Humidity ${day.humidity}%.`);
    if (day.windSpeed !== undefined) parts.push(`Wind ${Math.round(day.windSpeed)} km/h.`);
    if (day.precipitation !== undefined && day.precipitation > 0) parts.push(`${day.precipitation}mm rain.`);
    return parts.join(' ');
  }

  // Add a helper to get the mapped icon for UnifiedDailyForecast
  function getForecastDayIcon(day: import("@/lib/types").UnifiedDailyForecast): string {
    // Try to use OpenMeteo weather_code if available
    const openmeteo = day?.sourceBreakdown?.openmeteo as { weather_code?: number } | undefined;
    if (openmeteo && typeof openmeteo.weather_code === 'number') {
      return mapWeatherCodeToCondition(openmeteo.weather_code);
    }
    // Fallback to string matching
    const condition = (day.condition || '').toLowerCase();
    const description = (day.description || '').toLowerCase();
    if (condition.includes('thunder') || description.includes('thunder')) return 'thunderstorm';
    if (condition.includes('hail') || description.includes('hail')) return 'hail';
    if (
      condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle') ||
      description.includes('rain') || description.includes('shower') || description.includes('drizzle')
    ) return 'rain';
    if (condition.includes('snow') || description.includes('snow') || description.includes('sleet') || description.includes('blizzard')) return 'snow';
    if (condition.includes('fog') || description.includes('fog') || description.includes('mist') || description.includes('haze')) return 'fog';
    if (condition.includes('wind') || description.includes('wind') || description.includes('breeze') || description.includes('gust')) return 'wind';
    if (condition.includes('cloud') || description.includes('cloud')) return 'cloud-sunny';
    if (condition.includes('clear') || condition.includes('sunny') || description.includes('clear') || description.includes('sunny')) return 'sun-light';
    return 'cloud';
  }

  return (
    <div
      className="relative w-full h-full min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Loader Overlay */}
      {isLoading && <WeatherLoaderOverlay />}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
      {/* Main App Content with minimal rounded corners */}
      <div className="relative z-10 bg-transparent text-white overflow-hidden rounded-lg h-screen">
        {/* Celsius/Fahrenheit Toggle - Top Right */}
        <div className="absolute top-6 right-8 z-20 flex gap-2">
          <button
            className={`px-2 py-2 rounded-xl font-semibold transition-all duration-200 text-lg focus:outline-none cursor-pointer
              ${tempUnit === 'C' ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg' : 'bg-transparent text-white/60 hover:bg-white/5'}`}
            style={{ minWidth: 32 }}
            onClick={() => setTempUnit('C')}
          >
            °C
          </button>
          <button
            className={`px-2 py-2 rounded-xl font-semibold transition-all duration-200 text-lg focus:outline-none cursor-pointer
              ${tempUnit === 'F' ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg' : 'bg-transparent text-white/60 hover:bg-white/5'}`}
            style={{ minWidth: 32 }}
            onClick={() => setTempUnit('F')}
          >
            °F
          </button>
        </div>
        <div className="relative z-10 flex h-full">
          {/* Left Sidebar */}
          <div className="w-96 p-6 pb-8 space-y-6 bg-white/5 backdrop-blur-sm shadow-xl rounded-r-2xl h-full">
            {/* Search */}
            {isLoading ? null : (
              <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                  disabled={weatherLoading}
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="ml-2 p-2 rounded-full bg-black/30 border border-white/20 text-gray-300 hover:bg-black/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use my location"
                  aria-label="Use my location"
                  disabled={weatherLoading}
                >
                  <WeatherBuddyIcon name="bx-current-location" size="1.25rem" className="h-5 w-5" />
                </button>
              </form>
            )}

            {/* Current City Display */}
            {isClient && selectedCity && !isLoading && (
              <div className="text-center text-white/80 text-sm">
                <span className="font-semibold">Current Location:</span> {selectedCity}
              </div>
            )}

            {/* Weather Error State */}
            {weatherError && !isLoading && (
              <div className="text-center text-red-400 mt-8 p-4 bg-red-900/20 rounded-lg">
                <div className="font-semibold mb-1">Weather Error</div>
                <div className="text-sm">{weatherError}</div>
              </div>
            )}

            {/* AQI Result - Moved to top */}
            {aqiLoading || isLoading ? null : aqiError ? (
              <div className="text-center text-red-400 mt-8 p-3 bg-red-900/20 rounded-lg">
                <div className="text-sm font-semibold mb-1">Air Quality Unavailable</div>
                <div className="text-xs">{aqiError}</div>
              </div>
            ) : aqi !== null && !aqiError ? (
              <div className="mt-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <WindIcon className={`w-16 h-16 ${getAirQualityColor()}`} />
                    <div className="ml-3">
                      <div className="text-5xl font-bold text-white">{aqi}</div>
                      <div className="text-xs text-gray-300">US EPA AQI</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-white mb-2">
                    {getAirQualityDescription(aqi)}
                  </div>
                  {aqiMainPollutant && aqiMainPollutant !== 'Unknown' && (
                    <div className="text-xs text-orange-300 flex items-center justify-center gap-1 mt-2">
                      {(() => {
                        const Icon = getPollutantIcon(aqiMainPollutant);
                        return <Icon className="inline w-3 h-3 text-orange-300" />;
                      })()}
                      <span>Main Pollutant: <span className="font-bold uppercase">{aqiMainPollutant}</span></span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* City Info Result - Moved to bottom */}
            {cityInfoLoading || isLoading ? null : cityInfoError ? (
              <div className="text-center text-red-400 mt-8 text-sm">{cityInfoError}</div>
            ) : cityInfo && !cityInfoError && (
              <div className="mt-8 space-y-4">
                {typeof cityInfo.thumbnail === 'string' && (
                  <Image
                    src={cityInfo.thumbnail}
                    alt={typeof cityInfo.title === 'string' ? cityInfo.title : ''}
                    className="mx-auto rounded-lg max-h-32 object-cover"
                    width={128}
                    height={128}
                    unoptimized
                  />
                )}
                <div className="text-center">
                  {typeof cityInfo.title === 'string' && <h2 className="text-xl font-semibold mb-1">{cityInfo.title}</h2>}
                  {typeof cityInfo.description === 'string' && (
                    <div className="text-sm text-gray-400 mb-2">
                      {(() => {
                        const words = cityInfo.description.trim().replace(/\s+/g, ' ').split(' ');
                        return words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
                      })()}
                    </div>
                  )}
                  {typeof cityInfo.summary === 'string' && <div className="text-sm text-gray-300 mb-2">{cityInfo.summary}</div>}
                  {typeof cityInfo.wikipedia_url === 'string' && (
                    <a href={cityInfo.wikipedia_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center mt-2">
                      <WikipediaIcon className={getAirQualityColor()} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tiny Data Source Badges at the bottom */}
            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 pointer-events-none select-none">
              <span className="px-2 py-0.5 text-[10px] bg-white/10 text-gray-300 rounded-full font-medium tracking-wide">IQAir</span>
              <span className="px-2 py-0.5 text-[10px] bg-white/10 text-gray-300 rounded-full font-medium tracking-wide">Openweathermap</span>
              <span className="px-2 py-0.5 text-[10px] bg-white/10 text-gray-300 rounded-full font-medium tracking-wide">Accuweather</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-transparent border-white/30 text-white">
                  National Weather
                </Badge>
                <TopCities city={selectedCity} />
              </div>
            </div>

            {/* Weather Details */}
            <div className="p-6">
              {isLoading ? null : weatherError ? (
                <div className="flex items-center justify-center h-[60vh] w-full">
                  <div className="text-center max-w-md">
                    <div className="text-2xl text-red-400 mb-4">Weather Error</div>
                    <div className="text-gray-400 mb-4">{weatherError}</div>
                    <button 
                      onClick={() => selectedCity && fetchWeatherData(selectedCity)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : displayWeather ? (
                <>
                  {/* Hero + 5-Day Forecast Row */}
                  <div className="flex flex-col md:flex-row items-start justify-center min-h-[40vh] w-full gap-8">
                    {/* Weather Hero Section - Reworked */}
                    <div className="flex-1 min-w-[250px] min-h-[480px] flex flex-col items-start text-left gap-2">
                      {/* 1. Condition Text */}
                      <span className="flex items-center gap-2 text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                            {heroIconCondition}
                            <WeatherIcon
                              condition={heroIconCondition}
                              size="48px"
                              className="text-white"
                            />
                          </span>
                      {/* 2. Temperature (Caveat for digits, serif for unit) */}
                      <div className="flex items-end">
                        {getTemperature(displayWeather) !== undefined ? (
                          <>
                            <span className="text-[20rem] font-caveat text-white drop-shadow-xl leading-none -ml-14" style={{ fontFamily: 'Caveat, cursive' }}>
                              {Math.round(tempUnit === 'C' ? getTemperature(displayWeather)! : getTemperature(displayWeather)! * 9/5 + 32)}
                            </span>
                            <span className="text-[3rem] text-white drop-shadow-xl ml-2 mb-4 md:mb-45">
                              &nbsp;°{tempUnit}
                            </span>
                          </>
                        ) : (
                          <span className="text-[8rem] md:text-[12rem] font-caveat text-white drop-shadow-xl" style={{ fontFamily: 'Caveat, cursive', lineHeight: 1 }}>
                            N/A
                          </span>
                        )}
                      </div>
                      {/* 3. Humidity */}
                      <div className="text-lg text-gray-200">
                        Humidity: {getHumidity(displayWeather) !== undefined ? formatHumidity(getHumidity(displayWeather)!) : 'N/A'}
                      </div>
                      {/* 4. Wind */}
                      <div className="text-lg text-gray-200">
                        Wind: {getWindSpeed(displayWeather) !== undefined ? formatWindSpeed(getWindSpeed(displayWeather)!) : 'N/A'}
                      </div>
                      {/* 6. Quirky Message */}
                      <div className="mt-4">
                        <div className="text-2xl text-white font-semibold" style={{ fontFamily: 'Caveat, cursive' }}>
                          {getWeatherAdvice({
                            main: heroIconCondition,
                            temp_max: selectedDay ? selectedDay.high : (getTemperature(displayWeather) || 0),
                            humidity: getHumidity(displayWeather) || 0,
                            wind: getWindSpeed(displayWeather) || 0
                          })}
                        </div>
                      </div>
                      {/* See Details Button */}
                      {forecastSummaries.length > 0 && (
                        <div className="mt-2 flex">
                          <button
                            onClick={() => setShowDetailedForecast(!showDetailedForecast)}
                            className={`flex items-center gap-1 text-white transition-all duration-200 text-sm font-medium focus:outline-none px-3 py-1 cursor-pointer rounded-lg
                              ${showDetailedForecast ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'hover:bg-white/10 hover:backdrop-blur-md hover:border hover:border-white/20'}`}
                          >
                            <span>{showDetailedForecast ? 'Hide Details' : 'See Details'}</span>
                            {showDetailedForecast ? (
                              <ArrowDownLeft width={20} height={20} />
                            ) : (
                              <ArrowUpRight width={20} height={20} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* 5-Day Forecast Glassmorphic Card (right, not floating) */}
                    {forecastSummaries.length > 0 && showDetailedForecast && (
                      <div className={`${selectedForecastDays === 5 ? 'w-full md:w-[420px]' : 'w-full md:w-[520px]'} bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 flex flex-col items-center justify-start mt-8 md:mt-0`}>
                        {/* Forecast Tabs */}
                        <div className="flex items-center justify-center mb-4 w-full">
                          <div className="flex gap-1">
                            {([5, 10, 15] as const).map((days) => (
                              <button
                                key={days}
                                onClick={() => selectedCity && fetchForecastData(selectedCity, days)}
                                disabled={forecastLoading}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  selectedForecastDays === days
                                    ? 'bg-white/20 text-white shadow-sm border border-white/30'
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                } ${forecastLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {days} Days
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full">
                          {selectedForecastDays === 5 ? (
                            // Detailed layout for 5 days
                            forecastSummaries.map((day, index) => (
                              <div
                                key={day.date}
                                className={`flex flex-row items-center px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer w-full min-h-[60px] max-h-[80px] ${
                                  effectiveDayIndex === index
                                    ? 'bg-white/30 border-orange-400 shadow-lg'
                                    : 'bg-white/20 border-white/20 hover:bg-orange-50/20'
                                }`}
                                onClick={() => setSelectedDayIndex(index)}
                              >
                                {/* Icon, Day, and Summary in a single row */}
                                <div className="flex flex-row items-center w-full">
                                  <span className="w-8 flex justify-center">
                                    <WeatherIcon condition={getForecastDayIcon(day)} size="24px" className="text-yellow-400" />
                                  </span>
                                  <span className="w-12 text-xl font-extrabold text-white drop-shadow-lg mr-3 flex-shrink-0">{day.day}</span>
                                  <span className="flex-1 text-xs text-white font-normal leading-tight whitespace-pre-line text-left">{getForecastSummary(day)}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            // Compact grid layout for 10 and 15 days
                            <div className="grid grid-cols-5 gap-2">
                              {forecastSummaries.map((day, index) => (
                                <div
                                  key={day.date}
                                  className={`flex flex-col items-center p-2 rounded-lg border transition-all duration-200 cursor-pointer min-h-[80px] ${
                                    effectiveDayIndex === index
                                      ? 'bg-white/30 border-orange-400 shadow-lg'
                                      : 'bg-white/20 border-white/20 hover:bg-orange-50/20'
                                  }`}
                                  onClick={() => setSelectedDayIndex(index)}
                                >
                                  {/* Day name */}
                                  <span className="text-xs font-semibold text-white mb-1">{day.day}</span>
                                  
                                  {/* Weather icon */}
                                  <span className="mb-1">
                                    <WeatherIcon condition={getForecastDayIcon(day)} size="20px" className="text-yellow-400" />
                                  </span>
                                  
                                  {/* High temperature */}
                                  <span className="text-sm font-bold text-white">
                                    {displayTemperature(day.high)}
                                  </span>
                                  
                                  {/* Low temperature */}
                                  <span className="text-xs text-gray-300">
                                    {displayTemperature(day.low)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hourly Chart */}
                  {selectedDayHours.length > 0 && (
                    <div className="mt-8">
                      <div className="p-6">                       
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={selectedDayHours.filter(item => item.temp !== undefined)}>
                            <CartesianGrid stroke="transparent" />
                            <XAxis
                              dataKey="time"
                              stroke="#ffffff"
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tick={false}
                              tickFormatter={(value) => {
                                // Try to parse as ISO or 'YYYY-MM-DD HH:mm:ss' or 'HH:mm'
                                let date;
                                if (typeof value === 'string') {
                                  // Try ISO or 'YYYY-MM-DD HH:mm:ss'
                                  date = parse(value.replace(' ', 'T'), "yyyy-MM-dd'T'HH:mm:ss", new Date());
                                  if (isNaN(date.getTime())) {
                                    // Try just hour/minute
                                    date = parse(value, "HH:mm", new Date());
                                  }
                                }
                                if (date && !isNaN(date.getTime())) {
                                  // For longer periods, show date and time
                                  if (selectedForecastDays > 5) {
                                    return format(date, 'MMM d, h:mm a');
                                  }
                                  return format(date, 'h:mm a');
                                }
                                return value;
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#ffffff',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                              }}
                              cursor={false}
                              labelFormatter={(value) => {
                                let date;
                                if (typeof value === 'string') {
                                  // Support both 'YYYY-MM-DDTHH:mm' and 'YYYY-MM-DD HH:mm:ss'
                                  date = value.includes('T')
                                    ? new Date(value)
                                    : new Date(value.replace(' ', 'T'));
                                } else {
                                  date = new Date(value);
                                }
                                if (!isNaN(date.getTime())) {
                                  return format(date, 'MMM d, h:mm a');
                                }
                                return value;
                              }}
                              formatter={(value, name) => {
                                if (name === "temp" || name === "temperature") {
                                  const unit = tempUnit === "F" ? "°F" : "°C";
                                  return [`${value}${unit}`, "Temp"];
                                }
                                return [value, name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="temp" 
                              stroke="#f97316" 
                              strokeWidth={3}
                              dot={{ fill: '#f97316', strokeWidth: 3, r: 0 }}
                              activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 0.5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

