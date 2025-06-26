import { z } from 'zod';

// City name validation - alphanumeric, spaces, hyphens, apostrophes, and common city name characters
export const citySchema = z.object({
  city: z.string()
    .min(1, 'City name is required')
    .max(100, 'City name too long')
    .regex(/^[a-zA-Z\s\-'.,()]+$/, 'Invalid city name format')
    .transform(val => val.trim())
});

// Coordinates validation
export const coordinatesSchema = z.object({
  lat: z.string()
    .min(1, 'Latitude is required')
    .transform((val, ctx) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < -90 || num > 90) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude must be between -90 and 90',
        });
        return z.NEVER;
      }
      return num;
    }),
  lon: z.string()
    .min(1, 'Longitude is required')
    .transform((val, ctx) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < -180 || num > 180) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude must be between -180 and 180',
        });
        return z.NEVER;
      }
      return num;
    }),
});

// Search query validation
export const searchQuerySchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long')
    .transform(val => val.trim())
});

// Pagination validation
export const paginationSchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const num = parseInt(val);
      return isNaN(num) || num < 1 || num > 100 ? 10 : num;
    }),
  offset: z.string()
    .optional()
    .transform((val) => {
      if (!val) return 0;
      const num = parseInt(val);
      return isNaN(num) || num < 0 ? 0 : num;
    }),
});

// Combined schemas for different API endpoints
export const weatherQuerySchema = citySchema;
export const forecastQuerySchema = citySchema;
export const hourlyQuerySchema = citySchema;
export const airQualityQuerySchema = coordinatesSchema;
export const cityInfoQuerySchema = citySchema;
export const topCitiesQuerySchema = paginationSchema.extend({
  country: z.string().optional(),
  region: z.string().optional(),
}); 