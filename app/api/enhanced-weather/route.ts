import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedWeatherData, ExtendedUnifiedWeatherData } from '../../../lib/weather-aggregator';
import { validateApiConfiguration } from '../../../lib/env';

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

    // Check API configuration status
    const apiStatus = validateApiConfiguration();
    const statusMessages = [
      `OpenWeatherMap: ${apiStatus.openweathermap ? '✅' : '❌'}`,
      `IQAir: ${apiStatus.iqair ? '✅' : '❌'}`,
      `AccuWeather: ${apiStatus.accuweather ? '✅' : '⚠️'}`,
      `Visual Crossing: ${apiStatus.visualcrossing ? '✅' : '⚠️'}`,
      `Tomorrow.io: ${apiStatus.tomorrowio ? '✅' : '⚠️'}`,
      `WeatherAPI.com: ${apiStatus.weatherapi ? '✅' : '⚠️'}`,
      `Open-Meteo: ${apiStatus.openmeteo ? '✅' : '❌'}`,
    ];

    // Get enhanced weather data with all APIs
    const weatherData: ExtendedUnifiedWeatherData = await getUnifiedWeatherData(city);

    return NextResponse.json({
      success: true,
      city,
      data: weatherData,
      apiStatus: statusMessages,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Enhanced weather API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch enhanced weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 