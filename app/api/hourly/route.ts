import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedHourlyForecast } from '@/lib/weather-aggregator';
import { hourlyQuerySchema } from '@/lib/validation';
import { weatherRateLimiter } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await weatherRateLimiter.check(request, {
    maxRequests: 60, // 60 requests per minute
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
  const validationResult = hourlyQuerySchema.safeParse({
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
  const days = parseInt(searchParams.get('days') || '2');

  // Validate days parameter
  if (days < 1 || days > 16) {
    return NextResponse.json(
      { error: 'Days parameter must be between 1 and 16' },
      { status: 400 }
    );
  }

  try {
    const hourlyData = await getUnifiedHourlyForecast(city, days);
    return NextResponse.json(hourlyData, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      }
    });
  } catch (error) {
    console.error('Hourly forecast API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hourly forecast data' },
      { status: 500 }
    );
  }
} 