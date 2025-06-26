import { validateApiConfiguration } from './env';

/**
 * Server-side environment validation
 * This should be called in API routes to ensure proper configuration
 */
export function validateServerEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const status = validateApiConfiguration();
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required APIs
  if (!status.openweathermap) {
    errors.push('OpenWeatherMap API key is missing');
  }
  
  if (!status.iqair) {
    errors.push('IQAir API key is missing');
  }
  
  // Check optional APIs
  if (!status.accuweather) {
    warnings.push('AccuWeather API key is not configured (optional)');
  }
  
  return {
    isValid: status.allRequired,
    errors,
    warnings,
  };
}

/**
 * Get environment status for API responses
 */
export function getEnvironmentStatus() {
  const validation = validateServerEnvironment();
  const status = validateApiConfiguration();
  
  return {
    status: validation.isValid ? 'ready' : 'error',
    required: status.allRequired,
    optional: status.accuweather,
    errors: validation.errors,
    warnings: validation.warnings,
  };
} 