import { NextRequest, NextResponse } from 'next/server';
import { geocodeCity } from '@/lib/openweathermap-api';
import citiesData from '@/largest_cities_by_country.json';

// Type definition for the cities data structure
type CitiesData = {
  [continent: string]: {
    [country: string]: string[];
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    // First, try to find the city in our predefined data
    const typedCitiesData = citiesData as CitiesData;
    let foundCountry: string | null = null;
    let foundCities: string[] = [];

    // Search through all continents for the city
    for (const countries of Object.values(typedCitiesData)) {
      for (const [country, cities] of Object.entries(countries)) {
        if (cities.some(c => c.toLowerCase().includes(city.toLowerCase()))) {
          foundCountry = country;
          foundCities = cities.filter(c => c.toLowerCase().includes(city.toLowerCase()));
          break;
        }
      }
      if (foundCountry) break;
    }

    // If we found the city in our predefined data, use it for better geocoding
    if (foundCountry && foundCities.length > 0) {
      // Try geocoding with the exact city name from our data
      for (const predefinedCity of foundCities) {
        const result = await geocodeCity(predefinedCity);
        if (result && result.country === foundCountry) {
          return NextResponse.json({
            ...result,
            data_source: 'predefined_data',
            matched_cities: foundCities
          });
        }
      }
    }

    // Fall back to original geocoding
    const result = await geocodeCity(city);
    
    if (!result) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      data_source: 'external_api'
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode city' },
      { status: 500 }
    );
  }
} 