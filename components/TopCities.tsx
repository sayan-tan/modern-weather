import React, { useEffect, useState } from 'react';
import { WeatherIcon } from './ui/weathericon';
import { Badge } from './ui/badge';

interface TopCitiesProps {
  city: string;
}

interface TopCitiesResponse {
  input_city: string;
  country: string;
  country_code: string;
  top_5_city_names: string[];
  data_source: string;
}

interface CityWeather {
  temp: number | null;
  condition: string;
  loading: boolean;
  error: boolean;
}

export default function TopCities({ city }: TopCitiesProps) {
  const [topCities, setTopCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<Record<string, CityWeather>>({});

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError(null);
    fetch(`/api/top-cities?city=${encodeURIComponent(city)}`)
      .then(res => res.json())
      .then((data: TopCitiesResponse) => {
        if (data.top_5_city_names) {
          setTopCities(data.top_5_city_names);
        } else {
          setError('No top cities found.');
        }
      })
      .catch(() => setError('Failed to fetch top cities.'))
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    if (topCities.length === 0) return;
    const newWeather: Record<string, CityWeather> = {};
    topCities.forEach(cityName => {
      newWeather[cityName] = { temp: null, condition: '', loading: true, error: false };
    });
    setWeather(newWeather);
    topCities.forEach(cityName => {
      fetch(`/api/weather?city=${encodeURIComponent(cityName)}`)
        .then(res => res.json())
        .then(data => {
          setWeather(prev => ({
            ...prev,
            [cityName]: {
              temp: typeof data.temperature === 'number' ? Math.round(data.temperature) : null,
              condition: data.condition || '',
              loading: false,
              error: false
            }
          }));
        })
        .catch(() => {
          setWeather(prev => ({
            ...prev,
            [cityName]: {
              temp: null,
              condition: '',
              loading: false,
              error: true
            }
          }));
        });
    });
  }, [topCities]);

  if (!city) return null;

  return (
    <div className="ml-2 flex flex-row gap-2 items-center">
      {loading ? (
        <div className="text-gray-300">Loading top cities...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <>
          {topCities.filter(cityName => {
            const w = weather[cityName];
            return w && !w.loading && !w.error && w.temp !== null;
          }).map((cityName) => (
            <Badge key={cityName} variant="outline" className="bg-transparent border-white/0 text-white">
              <span className="truncate max-w-[110px]">{cityName}</span>
              <span className="font-semibold ml-1">
                {weather[cityName]?.temp !== null ? `${weather[cityName]?.temp}°` : 'N/A'}
              </span>
              <WeatherIcon condition={weather[cityName]?.condition || ''} size="1.3rem" className="ml-1" />
            </Badge>
          ))}
        </>
      )}
    </div>
  );
} 