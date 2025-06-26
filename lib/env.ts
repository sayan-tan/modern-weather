import { cleanEnv, str, makeValidator } from 'envalid';

// Custom validator for API keys
const apiKey = makeValidator<string>((input) => {
    if (typeof input !== 'string') {
        throw new Error('API key must be a string');
    }
    if (input.trim().length === 0) {
        throw new Error('API key cannot be empty');
    }
    if (input.length < 10) {
        throw new Error('API key seems too short');
    }
    return input.trim();
});

// Custom validator for optional API keys
const optionalApiKey = makeValidator<string | undefined>((input) => {
    if (input === undefined || input === '') {
        return undefined;
    }
    if (typeof input !== 'string') {
        throw new Error('API key must be a string');
    }
    if (input.trim().length === 0) {
        return undefined;
    }
    if (input.length < 10) {
        throw new Error('API key seems too short');
    }
    return input.trim();
});

// Environment validation
export const env = cleanEnv(process.env, {
    // Required API keys
    OPENWEATHERMAP_API_KEY: apiKey({
        desc: 'OpenWeatherMap API key for weather data',
        example: '1234567890abcdef1234567890abcdef',
    }),

    IQAIR_API_KEY: apiKey({
        desc: 'IQAir API key for air quality data',
        example: '12345678-1234-1234-1234-123456789012',
    }),

    // Optional API keys
    ACCUWEATHER_API_KEY: optionalApiKey({
        desc: 'AccuWeather API key for additional weather data (optional)',
        example: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456',
    }),

    // Node environment
    NODE_ENV: str({
        choices: ['development', 'test', 'production'],
        default: 'development',
        desc: 'Node.js environment',
    }),
});

// Export validated environment variables
export const {
    OPENWEATHERMAP_API_KEY,
    IQAIR_API_KEY,
    ACCUWEATHER_API_KEY,
    NODE_ENV,
} = env;

// Helper function to check if all required APIs are configured
export function validateApiConfiguration(): {
    openweathermap: boolean;
    iqair: boolean;
    accuweather: boolean;
    allRequired: boolean;
} {
    return {
        openweathermap: !!OPENWEATHERMAP_API_KEY,
        iqair: !!IQAIR_API_KEY,
        accuweather: !!ACCUWEATHER_API_KEY,
        allRequired: !!(OPENWEATHERMAP_API_KEY && IQAIR_API_KEY),
    };
}

// Helper function to get API configuration status
export function getApiStatus(): string[] {
    const status = validateApiConfiguration();
    const messages: string[] = [];

    if (!status.openweathermap) {
        messages.push('❌ OpenWeatherMap API key is missing');
    } else {
        messages.push('✅ OpenWeatherMap API key is configured');
    }

    if (!status.iqair) {
        messages.push('❌ IQAir API key is missing');
    } else {
        messages.push('✅ IQAir API key is configured');
    }

    if (!status.accuweather) {
        messages.push('⚠️  AccuWeather API key is not configured (optional)');
    } else {
        messages.push('✅ AccuWeather API key is configured');
    }

    return messages;
} 