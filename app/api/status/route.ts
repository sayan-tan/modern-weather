import { NextResponse } from 'next/server';
import { getEnvironmentStatus } from '@/lib/server-validation';

export async function GET() {
  try {
    const status = getEnvironmentStatus();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...status
    });
  } catch (error) {
    console.error('Status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get environment status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 