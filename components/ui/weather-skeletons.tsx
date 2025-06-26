import { Skeleton } from "./skeleton"

// Main weather hero skeleton
export function WeatherHeroSkeleton() {
  return (
    <div className="flex-1 min-w-[250px] min-h-[480px]">
      {/* Condition skeleton */}
      <div className="mb-2">
        <Skeleton className="h-16 w-48" />
      </div>
      
      {/* Temperature skeleton */}
      <div className="mt-0 mb-0">
        <Skeleton className="h-48 w-64" />
      </div>
      
      {/* Humidity and Wind skeleton */}
      <div className="max-w-2xl mt-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-6 w-40" />
      </div>
      
      {/* Weather Icon skeleton */}
      <div className="mt-4">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      
      {/* Weather Advice skeleton */}
      <div className="mt-4">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-6 w-56" />
      </div>
      
      {/* See Details Button skeleton */}
      <div className="mt-2 mb-2">
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

// 5-Day Forecast skeleton
export function ForecastSkeleton() {
  return (
    <div className="w-full md:w-[420px] bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 flex flex-col items-center justify-start mt-8 md:mt-0">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex flex-col gap-2 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between px-4 py-2 rounded-lg border bg-white/10 border-white/20 w-full min-h-[48px] max-h-[56px]">
            <div className="flex items-center gap-4 w-full">
              <Skeleton className="h-5 w-12" />
              <div className="flex-1 flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20 ml-2" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Hourly Chart skeleton
export function HourlyChartSkeleton() {
  return (
    <div className="w-full mt-8">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="w-full h-[150px] rounded-lg" />
    </div>
  )
}

// City Info skeleton
export function CityInfoSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <Skeleton className="mx-auto rounded-lg h-32 w-full max-w-48" />
      <div className="text-center">
        <Skeleton className="h-6 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
        <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
      </div>
    </div>
  )
}

// AQI skeleton
export function AQISkeleton() {
  return (
    <div className="mt-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="ml-3">
            <Skeleton className="text-5xl font-bold h-16 w-20" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
        </div>
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
    </div>
  )
}

// Search skeleton
export function SearchSkeleton() {
  return (
    <div className="relative flex items-center gap-2">
      <Skeleton className="absolute left-3 top-3 h-4 w-4 rounded-full" />
      <Skeleton className="pl-10 h-10 w-full rounded-lg" />
      <Skeleton className="ml-2 h-10 w-10 rounded-full" />
    </div>
  )
}

// Main content skeleton (for when no city is selected)
export function MainContentSkeleton() {
  return (
    <div className="flex items-center justify-center h-[60vh] w-full">
      <div className="text-center">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>
    </div>
  )
} 