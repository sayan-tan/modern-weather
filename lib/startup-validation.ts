import { validateApiConfiguration, getApiStatus } from './env';

/**
 * Validates environment configuration on startup
 * This function should be called early in the application lifecycle
 */
export function validateStartupConfiguration(): void {
  const status = validateApiConfiguration();
  
  // Check if all required APIs are configured
  if (!status.allRequired) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables in production');
    }
  }
  
  // Log optional API status
  if (!status.accuweather) {
  } else {
  }
}

/**
 * Get a summary of the current API configuration
 */
export function getConfigurationSummary(): {
  required: boolean;
  optional: boolean;
  status: string[];
} {
  const status = validateApiConfiguration();
  const messages = getApiStatus();
  
  return {
    required: status.allRequired,
    optional: status.accuweather,
    status: messages,
  };
} 