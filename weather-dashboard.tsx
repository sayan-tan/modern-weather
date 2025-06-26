"use client"

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { UnifiedWeatherData, Unified5DayForecast, UnifiedHourlyForecast, UnifiedHourlyForecastItem } from "@/lib/types"
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
import { 
  WeatherHeroSkeleton, 
  ForecastSkeleton, 
  HourlyChartSkeleton, 
  CityInfoSkeleton, 
  AQISkeleton, 
  SearchSkeleton
} from "@/components/ui/weather-skeletons"
import Image from "next/image"
import { format, parse } from "date-fns"
import TopCities from './components/TopCities'

export default function WeatherDashboard() {
  // Load selectedCity from localStorage on mount
  const [selectedCity, setSelectedCity] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("")
  const [unifiedWeather, setUnifiedWeather] = useState<UnifiedWeatherData | null>(null)
  const [unified5Day, setUnified5Day] = useState<Unified5DayForecast>([]);
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
    
    try {
      // Fetch all weather data in parallel for better performance
      const [weatherRes, forecastRes, hourlyRes] = await Promise.all([
        fetch(`/api/weather?city=${encodeURIComponent(city)}`),
        fetch(`/api/forecast?city=${encodeURIComponent(city)}`),
        fetch(`/api/hourly?city=${encodeURIComponent(city)}`)
      ]);
      
      if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
      if (!forecastRes.ok) throw new Error('Failed to fetch forecast data');
      if (!hourlyRes.ok) throw new Error('Failed to fetch hourly data');
      
      const [unified, agg5Day, aggHourly] = await Promise.all([
        weatherRes.json(),
        forecastRes.json(),
        hourlyRes.json()
      ]);
      
      setUnifiedWeather(unified);
      setUnified5Day(agg5Day);
      setUnifiedHourly(aggHourly);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeatherError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setUnifiedWeather(null);
      setUnified5Day([]);
      setUnifiedHourly([]);
    } finally {
      setWeatherLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCity) {
      fetchWeatherData(selectedCity);
    } else {
      setUnifiedWeather(null);
      setUnified5Day([]);
      setUnifiedHourly([]);
      setWeatherError(null);
    }
  }, [selectedCity])

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
  const fiveDaySummaries = unified5Day;

  // Find today's index in the 5-day forecast
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayIndex = fiveDaySummaries.findIndex(day => day.date === todayDateStr) !== -1 ? fiveDaySummaries.findIndex(day => day.date === todayDateStr) : 0;

  // Determine which day to show: if forecast card is open, use selectedDayIndex, else use today
  const effectiveDayIndex = showDetailedForecast ? selectedDayIndex : todayIndex;
  const selectedDay = fiveDaySummaries[effectiveDayIndex];
  
  // Get all hourly items for the selected day - fix the date matching logic
  const selectedDayDate = selectedDay ? selectedDay.date : null;
  const selectedDayHours = selectedDayDate && unifiedHourly.length > 0
    ? unifiedHourly.filter(item => {
        // Handle both ISO date format and display time format
        const itemDate = item.time.split(' ')[0]; // Get just the date part
        return itemDate === selectedDayDate;
      })
    : [];
  
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

  // Helper function to get condition from either data type
  const getCondition = (weather: UnifiedWeatherData | UnifiedHourlyForecastItem | null) => {
    if (!weather) return 'default';
    
    const condition = weather.condition;
    const description = 'description' in weather && typeof (weather as { description: string }).description === 'string' 
      ? (weather as { description: string }).description 
      : '';
    
    // If we have a description, use it for better condition detection
    if (description && description.trim() !== '') {
      const desc = description.toLowerCase();
      
      // Check for rain conditions in description
      if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
        return 'rainy';
      }
      
      // Check for storm conditions in description
      if (desc.includes('storm') || desc.includes('thunder') || desc.includes('lightning')) {
        return 'storm';
      }
      
      // Check for snow conditions in description
      if (desc.includes('snow') || desc.includes('sleet') || desc.includes('blizzard')) {
        return 'snowy';
      }
      
      // Check for fog/mist conditions in description
      if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) {
        return 'fog';
      }
      
      // Check for wind conditions in description
      if (desc.includes('wind') || desc.includes('breeze') || desc.includes('gust')) {
        return 'windy';
      }
    }
    
    // Fall back to the main condition, but normalize it to lowercase
    if (condition && condition.trim() !== '') {
      const normalized = condition.toLowerCase();
      // Map common conditions to video-friendly names
      if (normalized === 'rain') return 'rainy';
      if (normalized === 'storm') return 'storm';
      if (normalized === 'snow') return 'snowy';
      if (normalized === 'wind') return 'windy';
      if (normalized === 'clear') return 'sunny';
      if (normalized === 'clouds' || normalized === 'cloudy') return 'cloudy';
      return normalized;
    }
    
    return 'default';
  };

  // When closing the forecast card, reset selectedDayIndex to today
  useEffect(() => {
    if (!showDetailedForecast && selectedDayIndex !== todayIndex) {
      setSelectedDayIndex(todayIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetailedForecast, todayIndex]);

  // Determine weather condition for video background - use same logic as displayWeather
  let weatherCondition = "default";
  if (displayWeather) {
    const mainCondition = getCondition(displayWeather);
    weatherCondition = mainCondition && mainCondition.trim() !== '' ? mainCondition : 'default';
  }

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

  const bgImage = getWeatherBackground(weatherCondition);
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
            {weatherLoading ? (
              <SearchSkeleton />
            ) : (
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
            {isClient && selectedCity && !weatherLoading && (
              <div className="text-center text-white/80 text-sm">
                <span className="font-semibold">Current Location:</span> {selectedCity}
              </div>
            )}

            {/* Data Sources Indicator */}
            {isClient && unifiedWeather && !weatherLoading && Object.keys(unifiedWeather.sourceBreakdown).length > 1 && (
              <div className="text-center text-white/60 text-xs">
                <div className="font-semibold mb-1">Data Sources:</div>
                <div className="flex justify-center gap-2">
                  {Object.keys(unifiedWeather.sourceBreakdown).map(source => (
                    <span key={source} className="px-2 py-1 bg-white/10 rounded-full capitalize">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Error State */}
            {weatherError && (
              <div className="text-center text-red-400 mt-8 p-4 bg-red-900/20 rounded-lg">
                <div className="font-semibold mb-1">Weather Error</div>
                <div className="text-sm">{weatherError}</div>
              </div>
            )}

            {/* AQI Result - Moved to top */}
            {aqiLoading ? (
              <AQISkeleton />
            ) : aqiError ? (
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
            {cityInfoLoading ? (
              <CityInfoSkeleton />
            ) : cityInfoError ? (
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
              {weatherLoading ? (
                <div className="flex flex-col md:flex-row items-start justify-center min-h-[40vh] w-full gap-8">
                  <WeatherHeroSkeleton />
                  {showDetailedForecast && <ForecastSkeleton />}
                  <HourlyChartSkeleton />
                </div>
              ) : weatherError ? (
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
                            {getCondition(displayWeather)}
                            <WeatherIcon
                              condition={getCondition(displayWeather)}
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
                            main: getCondition(displayWeather),
                            temp_max: selectedDay ? selectedDay.high : (getTemperature(displayWeather) || 0),
                            humidity: getHumidity(displayWeather) || 0,
                            wind: getWindSpeed(displayWeather) || 0
                          })}
                        </div>
                      </div>
                      {/* See Details Button */}
                      {fiveDaySummaries.length > 0 && (
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
                    {fiveDaySummaries.length > 0 && showDetailedForecast && (
                      <div className="w-full md:w-[420px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 flex flex-col items-center justify-start mt-8 md:mt-0">
                        <h3 className="text-lg font-semibold text-center mb-4 text-white">5-Day Forecast</h3>
                        <div className="flex flex-col gap-2 w-full">
                          {fiveDaySummaries.map((day, index) => (
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
                                  <WeatherIcon condition={day.condition} size="24px" className="text-yellow-400" />
                                </span>
                                <span className="w-12 text-xl font-extrabold text-white drop-shadow-lg mr-3 flex-shrink-0">{day.day}</span>
                                <span className="flex-1 text-xs text-white font-normal leading-tight whitespace-pre-line text-left">{getForecastSummary(day)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hourly Chart */}
                  {selectedDayHours.length > 0 && (
                    <div className="mt-8">
                      <div className="p-6">
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={selectedDayHours}>
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
                                const date = typeof value === 'string'
                                  ? parse(value.replace(' ', 'T'), "yyyy-MM-dd'T'HH:mm:ss", new Date())
                                  : new Date(value);
                                if (!isNaN(date.getTime())) {
                                  return format(date, 'h:mm a');
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
                              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
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

