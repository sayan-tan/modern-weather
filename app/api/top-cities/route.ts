import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cityInfoQuerySchema } from '@/lib/validation';
import { externalAPIRateLimiter } from '@/lib/rate-limiter';
import citiesData from '@/largest_cities_by_country.json';

// Type definition for the cities data structure
type CitiesData = {
  [continent: string]: {
    [country: string]: string[];
  };
};

function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(city|province|district|territory|region|state|county|neighborhood|neighbourhood|metropolitan|municipality)\b/g, '')
    .replace(/[^a-z]/g, '') // remove non-letters for stricter matching
    .trim();
}

function filterAndDeduplicate(cityNames: string[], searchedCity: string): string[] {
  const seen = new Set<string>();
  const normSearched = normalizeCityName(searchedCity);
  const result: string[] = [];
  for (const name of cityNames) {
    const norm = normalizeCityName(name);
    if (norm === normSearched) continue; // Exclude searched city itself
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(name);
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  // Check rate limit
  const rateLimitResult = await externalAPIRateLimiter.check(req, {
    maxRequests: 20, // 20 requests per minute (very restrictive due to external API costs)
    interval: 60000, // 1 minute
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        }
      }
    );
  }

  const { searchParams } = new URL(req.url);
  
  // Validate input parameters
  const validationResult = cityInfoQuerySchema.safeParse({
    city: searchParams.get('city')
  });

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid input parameters',
        details: validationResult.error.errors 
      }, 
      { status: 400 }
    );
  }

  const { city } = validationResult.data;

  try {
    // Step 1: Get country code from OpenCage
    const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: city,
        key: process.env.OPENCAGE_API_KEY,
      }
    });

    const components = geoRes.data?.results?.[0]?.components;
    const countryCode = components?.country_code?.toUpperCase(); // Use uppercase for GeoDB
    const country = components?.country;

    if (!countryCode) {
      return NextResponse.json({ error: 'Could not determine country from city name' }, { status: 404 });
    }

    // Step 2: Check if we have predefined cities for this country
    let topCities: string[] = [];
    let dataSource = 'external_api';

    // Search through all continents for the country
    const typedCitiesData = citiesData as CitiesData;
    for (const countries of Object.values(typedCitiesData)) {
      if (countries[country]) {
        topCities = countries[country];
        dataSource = 'predefined_data';
        break;
      }
    }

    // If no predefined cities found, fall back to external API
    if (topCities.length === 0) {
      const citiesRes = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        params: {
          countryIds: countryCode,
          limit: 8,
          sort: '-population'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      });

      const rawCityNames = citiesRes.data.data.map((c: { name: string }) => c.name);
      topCities = filterAndDeduplicate(rawCityNames, city).slice(0, 5);
    } else {
      // Filter out the searched city from predefined list
      topCities = filterAndDeduplicate(topCities, city).slice(0, 5);
    }

    return NextResponse.json({
      input_city: city,
      country,
      country_code: countryCode,
      top_5_city_names: topCities,
      data_source: dataSource
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      }
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      if ('response' in err && err.response) {
        // @ts-expect-error: Axios error object may have a response property that is not typed
        return NextResponse.json({ error: err.message, responseData: JSON.stringify(err.response.data) }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
} 