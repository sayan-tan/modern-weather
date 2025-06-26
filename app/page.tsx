"use client"

import WeatherDashboard from "../weather-dashboard"
import { WeatherErrorBoundary } from "../components/weather-error-boundary"

export default function Page() {
  return (
    <WeatherErrorBoundary>
      <WeatherDashboard />
    </WeatherErrorBoundary>
  )
}
