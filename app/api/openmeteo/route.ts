import { NextRequest, NextResponse } from 'next/server';
import { 
    getComprehensiveWeatherByCity, 
    getWeatherByCoords, 
    getCurrentWeatherByCity,
    getHourlyForecastByCity,
    getDailyForecastByCity,
    convertToUnifiedWeatherData
} from '../../../lib/openmeteo-api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');
        const type = searchParams.get('type') || 'comprehensive'; // current, hourly, daily, comprehensive
        const days = parseInt(searchParams.get('days') || '7');

        // Validate input parameters
        if (!city && (!lat || !lon)) {
            return NextResponse.json(
                { error: 'Either city or lat/lon coordinates must be provided' },
                { status: 400 }
            );
        }

        if (days < 1 || days > 16) {
            return NextResponse.json(
                { error: 'Days parameter must be between 1 and 16' },
                { status: 400 }
            );
        }

        let weatherData;

        // Get weather data based on type and location
        if (city) {
            switch (type) {
                case 'current':
                    weatherData = await getCurrentWeatherByCity(city);
                    break;
                case 'hourly':
                    weatherData = await getHourlyForecastByCity(city, days);
                    break;
                case 'daily':
                    weatherData = await getDailyForecastByCity(city, days);
                    break;
                case 'comprehensive':
                default:
                    weatherData = await getComprehensiveWeatherByCity(city, days);
                    break;
            }
        } else {
            // Using coordinates
            const latitude = parseFloat(lat!);
            const longitude = parseFloat(lon!);
            
            if (isNaN(latitude) || isNaN(longitude)) {
                return NextResponse.json(
                    { error: 'Invalid latitude or longitude values' },
                    { status: 400 }
                );
            }

            weatherData = await getWeatherByCoords(latitude, longitude, days);
        }

        // Convert to unified format if requested
        const format = searchParams.get('format') || 'raw';
        if (format === 'unified' && weatherData.current_weather) {
            const unifiedData = convertToUnifiedWeatherData(weatherData);
            return NextResponse.json({
                success: true,
                data: unifiedData,
                source: 'openmeteo',
                timestamp: new Date().toISOString(),
            });
        }

        // Return raw data
        return NextResponse.json({
            success: true,
            data: weatherData,
            source: 'openmeteo',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Open-Meteo API error:', error);
        
        if (error instanceof Error) {
            return NextResponse.json(
                { 
                    error: error.message,
                    source: 'openmeteo',
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                error: 'An unexpected error occurred while fetching weather data',
                source: 'openmeteo',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// Handle POST requests for batch operations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cities, days = 7 } = body;

        if (!cities || !Array.isArray(cities) || cities.length === 0) {
            return NextResponse.json(
                { error: 'Cities array is required and must not be empty' },
                { status: 400 }
            );
        }

        if (cities.length > 10) {
            return NextResponse.json(
                { error: 'Maximum 10 cities allowed per batch request' },
                { status: 400 }
            );
        }

        const results = [];
        const successful = [];
        const failed = [];

        for (const city of cities) {
            try {
                const weatherData = await getComprehensiveWeatherByCity(city, days);
                const result = {
                    city,
                    success: true,
                    data: weatherData,
                };
                results.push(result);
                successful.push(result);
            } catch (error) {
                const result = {
                    city,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
                results.push(result);
                failed.push(result);
            }
        }

        return NextResponse.json({
            success: true,
            total: cities.length,
            successful: successful.length,
            failed: failed.length,
            results: {
                successful,
                failed,
            },
            source: 'openmeteo',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Open-Meteo batch API error:', error);
        
        return NextResponse.json(
            { 
                error: 'An unexpected error occurred while processing batch request',
                source: 'openmeteo',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
} 