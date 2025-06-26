import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CloudSunny,
  DewPoint,
  Fog,
  HeavyRain,
  Rain,
  Snow,
  SnowFlake,
  SunLight,
  TemperatureDown,
  TemperatureHigh,
  TemperatureLow,
  TemperatureUp,
  Thunderstorm,
  Wind,
} from 'iconoir-react';

const ICONS = [
  Cloud,
  CloudSunny,
  DewPoint,
  Fog,
  HeavyRain,
  Rain,
  Snow,
  SnowFlake,
  SunLight,
  TemperatureDown,
  TemperatureHigh,
  TemperatureLow,
  TemperatureUp,
  Thunderstorm,
  Wind,
];

export default function WeatherLoaderOverlay() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ICONS.length);
        setFade(true);
      }, 50); // fade out duration (faster)
    }, 333); // total duration per icon (5s ÷ 15 icons = ~333ms each)
    return () => clearInterval(interval);
  }, []);

  const Icon = ICONS[index];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <div
          className={`transition-all duration-300 ease-in-out ${fade ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <Icon width={96} height={96} className="text-white drop-shadow-xl" />
        </div>
        <div className="mt-6 text-white text-lg font-semibold tracking-wide animate-pulse">
          Loading weather data...
        </div>
      </div>
    </div>
  );
} 