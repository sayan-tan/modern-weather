# 🌤️ Modern Weather App

A beautiful, modern weather application built with Next.js 15, React 19, and TypeScript. Features real-time weather data, 5-day forecasts, hourly predictions, air quality information, and city details with a responsive, intuitive interface.

## ✨ Features

- **Real-time Weather Data**: Current conditions with temperature, humidity, wind speed, and weather conditions
- **5-Day Forecast**: Detailed weather predictions for the next 5 days
- **Hourly Forecast**: Hour-by-hour weather predictions with interactive charts
- **Air Quality Index**: Real-time AQI data with pollutant information
- **City Information**: Wikipedia integration for city details and facts
- **Location Services**: Use your current location for instant weather data
- **Responsive Design**: Beautiful UI that works on desktop, tablet, and mobile
- **Error Handling**: Robust error boundaries and graceful fallbacks
- **Caching**: Intelligent caching for better performance
- **Multiple Weather APIs**: Aggregates data from OpenWeatherMap and AccuWeather for reliability
- **Environment Validation**: Automatic validation of API keys and configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- API keys for weather services (see [API Configuration](#api-configuration))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd modern-weather
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   IQAIR_API_KEY=your_iqair_api_key
   ACCUWEATHER_API_KEY=your_accuweather_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 API Configuration

### Required API Keys

This application uses multiple weather APIs for redundancy and comprehensive data:

#### 1. OpenWeatherMap API
- **Purpose**: Primary weather data source
- **Get API Key**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Environment Variable**: `OPENWEATHERMAP_API_KEY`
- **Free Tier**: 1,000 calls/day

#### 2. AccuWeather API (Optional)
- **Purpose**: Secondary weather data source for redundancy
- **Get API Key**: [AccuWeather API](https://developer.accuweather.com/)
- **Environment Variable**: `ACCUWEATHER_API_KEY`
- **Free Tier**: 50 calls/day

#### 3. IQAir API
- **Purpose**: Air quality data
- **Get API Key**: [IQAir API](https://www.iqair.com/air-pollution-data-api)
- **Environment Variable**: `IQAIR_API_KEY`
- **Free Tier**: 10,000 calls/month

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here
IQAIR_API_KEY=your_iqair_api_key_here

# Optional (for redundancy)
ACCUWEATHER_API_KEY=your_accuweather_api_key_here
```

### Environment Validation

The app includes automatic environment validation using the `envalid` library:

- **Startup Validation**: Checks all required API keys on app startup
- **API Route Validation**: Validates configuration before processing requests
- **Status Endpoint**: Check configuration status at `/api/status`

```bash
# Check environment status
curl http://localhost:3000/api/status
```

## 📁 Project Structure

```
modern-weather/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   │   ├── air-quality/   # Air quality endpoint
│   │   ├── forecast/      # 5-day forecast endpoint
│   │   ├── hourly/        # Hourly forecast endpoint
│   │   ├── status/        # Environment status endpoint
│   │   ├── weather/       # Current weather endpoint
│   │   └── city-info/     # City information endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── weather-error-boundary.tsx
├── config/               # Configuration files
│   └── api.ts           # API configuration
├── lib/                  # Utility libraries
│   ├── env.ts           # Environment validation
│   ├── server-validation.ts # Server-side validation
│   ├── startup-validation.ts # Startup validation
│   ├── openweathermap-api.ts
│   ├── air-quality-api.ts
│   ├── weather-aggregator.ts
│   ├── types.ts
│   └── utils.ts
├── public/               # Static assets
│   └── weather/         # Weather background images
└── weather-dashboard.tsx # Main dashboard component
```

## 🔌 API Endpoints

### Current Weather
```
GET /api/weather?city={cityName}
```
Returns current weather conditions for a city.

**Response:**
```json
{
  "temperature": 22.5,
  "humidity": 65,
  "windSpeed": 12.3,
  "condition": "Partly Cloudy",
  "city": "New York",
  "country": "US",
  "coordinates": { "lat": 40.7128, "lon": -74.0060 }
}
```

### 5-Day Forecast
```
GET /api/forecast?city={cityName}
```
Returns 5-day weather forecast.

### Hourly Forecast
```
GET /api/hourly?city={cityName}
```
Returns hourly weather predictions for the next 12 hours.

### Air Quality
```
GET /api/air-quality?lat={latitude}&lon={longitude}
```
Returns air quality index and pollutant information.

### City Information
```
GET /api/city-info?city={cityName}
```
Returns city details from Wikipedia.

### Environment Status
```
GET /api/status
```
Returns environment configuration status.

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "status": "ready",
  "required": true,
  "optional": false,
  "errors": [],
  "warnings": ["AccuWeather API key is not configured (optional)"]
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Custom components
- **Charts**: Recharts
- **Icons**: Lucide React + Iconoir
- **HTTP Client**: Axios
- **Validation**: Zod + Envalid
- **Caching**: LRU Cache

### Key Features Implementation

#### Environment Validation
- **Envalid Integration**: Automatic validation of environment variables
- **Custom Validators**: API key format validation
- **Startup Checks**: Configuration validation on app startup
- **API Route Protection**: Environment validation in API routes

#### Weather Data Aggregation
The app aggregates data from multiple weather APIs for reliability:
- Primary: OpenWeatherMap API
- Secondary: AccuWeather API (fallback)
- Air Quality: IQAir API

#### Error Handling
- Comprehensive error boundaries
- Graceful fallbacks for API failures
- User-friendly error messages
- Retry mechanisms for failed requests

#### Performance Optimizations
- Intelligent caching with LRU cache
- Parallel API requests
- Lazy loading of components
- Optimized images and assets

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

3. **Environment Variables in Vercel**
   - Go to your project settings in Vercel
   - Add the same environment variables as in your `.env.local`

### Other Platforms

#### Netlify
```bash
npm run build
# Deploy the 'out' directory
```

#### Railway
```bash
# Connect your GitHub repo
# Add environment variables in Railway dashboard
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
OPENWEATHERMAP_API_KEY=your_production_key
IQAIR_API_KEY=your_production_key
ACCUWEATHER_API_KEY=your_production_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### API Key Errors
- Ensure all API keys are correctly set in `.env.local`
- Check API key permissions and quotas
- Verify API key format (no extra spaces or characters)
- Use the `/api/status` endpoint to check configuration

#### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

#### Weather Data Not Loading
- Check browser console for API errors
- Verify city name spelling
- Ensure internet connection is stable
- Check environment validation status

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Create a new issue with detailed error information
- Include browser console logs and API response errors
- Use `/api/status` to verify environment configuration

## 🙏 Acknowledgments

- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [AccuWeather](https://developer.accuweather.com/) for additional weather data
- [IQAir](https://www.iqair.com/) for air quality data
- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) for accessible components
