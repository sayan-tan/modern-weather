import { NextRequest, NextResponse } from 'next/server';
import { getAirQualityData } from '@/lib/air-quality-api';
import { airQualityQuerySchema } from '@/lib/validation';
import { airQualityRateLimiter } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await airQualityRateLimiter.check(request, {
    maxRequests: 30, // 30 requests per minute (more restrictive due to external API costs)
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

  const { searchParams } = new URL(request.url);
  
  // Validate input parameters
  const validationResult = airQualityQuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon')
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

  const { lat, lon } = validationResult.data;

  try {
    const aqiData = await getAirQualityData(lat, lon);
    return NextResponse.json(aqiData, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      }
    });
  } catch (error) {
    console.error('Air quality API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch air quality data' },
      { status: 500 }
    );
  }
} 