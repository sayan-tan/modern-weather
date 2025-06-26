import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cityInfoQuerySchema } from '@/lib/validation';
import { cityInfoRateLimiter } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  // Check rate limit
  const rateLimitResult = await cityInfoRateLimiter.check(req, {
    maxRequests: 40, // 40 requests per minute (moderate due to external API calls)
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

  // Try a list of alternates for common cities (add more as needed)
  const alternates: string[] = [city];
  if (city.toLowerCase() === 'bengaluru' || city.toLowerCase() === 'bangalore') {
    alternates.push('Bangalore', 'Bengaluru');
  }

  // Try Wikipedia summary for each alternate
  for (const alt of alternates) {
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(alt)}`;
      const wikiRes = await axios.get(wikiUrl);
      const data = wikiRes.data;
      if (data.type !== 'disambiguation') {
        return NextResponse.json({
          title: data.title,
          description: data.description,
          summary: data.extract,
          thumbnail: data.thumbnail?.source || null,
          coordinates: data.coordinates || null,
          wikipedia_url: data.content_urls?.desktop?.page || null,
          source: 'Wikipedia'
        }, {
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        });
      }
    } catch {
      // Continue to next alternate
    }
  }

  // Try Wikipedia search API for fuzzy match
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(city)}&format=json&origin=*`;
    const searchRes = await axios.get(searchUrl);
    const searchResults = searchRes.data?.query?.search;
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const bestTitle = searchResults[0].title;
      // Try summary for best match
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
      const wikiRes = await axios.get(wikiUrl);
      const data = wikiRes.data;
      if (data.type !== 'disambiguation') {
        return NextResponse.json({
          title: data.title,
          description: data.description,
          summary: data.extract,
          thumbnail: data.thumbnail?.source || null,
          coordinates: data.coordinates || null,
          wikipedia_url: data.content_urls?.desktop?.page || null,
          source: 'Wikipedia-Fuzzy'
        }, {
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        });
      }
    }
  } catch {
    // Continue to GeoDB fallback
  }

  // Fallback: Try GeoDB for city info
  try {
    const geoDbRes = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      params: {
        namePrefix: city,
        limit: 1
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });
    const geoData = geoDbRes.data.data?.[0];
    if (geoData) {
      return NextResponse.json({
        title: geoData.city || geoData.name,
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.region,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        population: geoData.population,
        wikiDataId: geoData.wikiDataId,
        source: 'GeoDB'
      }, {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        }
      });
    }
  } catch {}

  // Fallback: Try country Wikipedia summary if city not found
  try {
    const geoDbRes = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      params: {
        namePrefix: city,
        limit: 1
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });
    const countryData = geoDbRes.data.data?.[0];
    const countryName = countryData?.country;
    if (countryName) {
      try {
        const countryWikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`;
        const countryWikiRes = await axios.get(countryWikiUrl);
        const countryWikiData = countryWikiRes.data;
        return NextResponse.json({
          title: countryWikiData.title,
          description: countryWikiData.description,
          summary: countryWikiData.extract,
          thumbnail: countryWikiData.thumbnail?.source || null,
          coordinates: countryWikiData.coordinates || null,
          wikipedia_url: countryWikiData.content_urls?.desktop?.page || null,
          source: 'Wikipedia-Country'
        }, {
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        });
      } catch {}
    }
  } catch {}

  return NextResponse.json({ error: 'City or country not found on Wikipedia or GeoDB' }, { status: 404 });
} 