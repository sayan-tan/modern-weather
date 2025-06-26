import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedWeatherData } from '@/lib/weather-aggregator';
import { weatherQuerySchema } from '@/lib/validation';
import { weatherRateLimiter } from '@/lib/rate-limiter';
import { validateServerEnvironment } from '@/lib/server-validation';

export async function GET(request: NextRequest) {
  // Validate environment configuration first
  const envValidation = validateServerEnvironment();
  if (!envValidation.isValid) {
    return NextResponse.json(
      { 
        error: 'Server configuration error',
        details: envValidation.errors,
        warnings: envValidation.warnings
      },
      { status: 500 }
    );
  }

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
  const validationResult = weatherQuerySchema.safeParse({
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
    const weatherData = await getUnifiedWeatherData(city);
    return NextResponse.json(weatherData, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      }
    });
  } catch (error) {
    console.error('Weather API error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 