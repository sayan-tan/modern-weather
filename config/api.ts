import { ACCUWEATHER_API_KEY } from '../lib/env';

export const API_CONFIG = {
  baseURL: 'https://dataservice.accuweather.com',
  endpoints: {
    locationSearch: '/locations/v1/cities/search',
    currentConditions: '/currentconditions/v1',
    forecast: '/forecasts/v1/daily/5day',
    hourlyForecast: '/forecasts/v1/hourly/12hour',
  },
};

export function getApiKey() {
  return ACCUWEATHER_API_KEY || '';
} 