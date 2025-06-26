import { OWMForecast, OWMForecastItem } from './openweathermap-api';

export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°`;
}

export function formatWindSpeed(speed: number): string {
  // Convert m/s to mph (1 m/s = 2.237 mph)
  const mph = speed * 2.237;
  return `${Math.round(mph)} mph`;
}

export function formatHumidity(humidity: number): string {
  return `${humidity}%`;
}

export function formatVisibility(visibility: number): string {
  // Convert meters to miles (1 meter = 0.000621371 miles)
  const miles = visibility * 0.000621371;
  return `${Math.round(miles)} mi`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getWeatherIcon(iconCode: string): string {
  // Map OpenWeatherMap icon codes to weather conditions
  const iconMap: { [key: string]: string } = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '🌨️', // snow
    '13n': '🌨️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  };
  return iconMap[iconCode] || '🌤️';
}

export function getWeatherDescription(weather: { weather: { description: string }[] }): string {
  if (!weather.weather || weather.weather.length === 0) return 'Unknown';
  return weather.weather[0].description;
}

export function getWeatherMain(weather: { weather: { main: string }[] }): string {
  if (!weather.weather || weather.weather.length === 0) return 'Unknown';
  return weather.weather[0].main;
}

export function processHourlyData(forecast: OWMForecast): Array<{ time: string; temp: number }> {
  // Get next 8 hours of data
  const hourlyData = forecast.list.slice(0, 8).map(item => ({
    time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
      hour: 'numeric',
      hour12: true 
    }),
    temp: Math.round(item.main.temp)
  }));
  return hourlyData;
}

export function processWeeklyData(forecast: OWMForecast): Array<{ day: string; high: number; low: number }> {
  // Group by day and get daily min/max
  const dailyData: { [key: string]: { temps: number[]; day: string } } = {};
  
  forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { temps: [], day: dayName };
    }
    dailyData[dayKey].temps.push(item.main.temp);
  });

  return Object.values(dailyData).map(({ temps, day }) => ({
    day,
    high: Math.round(Math.max(...temps)),
    low: Math.round(Math.min(...temps))
  }));
}

export function getAirQualityColor(): string {
  return 'text-orange-400';
}

export function getAirQualityDescription(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}

export function getWeatherBackground(condition: string): string {
  const cond = condition.toLowerCase();
  if (cond.includes('clear') || cond.includes('sunny')) return '/weather/sunny.jpg';
  if (cond.includes('cloud')) return '/weather/cloudy.jpg';
  if (cond.includes('rain') || cond.includes('drizzle')) return '/weather/rainy.jpg';
  if (cond.includes('storm') || cond.includes('thunder')) return '/weather/storm.jpg';
  if (cond.includes('snow')) return '/weather/snowy.jpg';
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return '/weather/fog.jpg';
  if (cond.includes('wind')) return '/weather/windy.jpg';
  return '/weather/default.jpg';
}

export function getWeatherAdvice({ main, temp_max, humidity, wind }: { main: string; temp_max: number; humidity: number; wind: number }): string {
  const lowerMain = main.toLowerCase();
  if (lowerMain.includes('clear') || lowerMain.includes('sun')) {
    if (temp_max >= 32) return "It's a total sun-blast out there! Time to flex those shades, double up on sunscreen, and maybe challenge your friends to a hydration contest. Stay cool, sun warrior!";
    return "Blue skies and good vibes! Perfect day for outdoor adventures, spontaneous picnics, or just vibing with your favorite playlist. Don't forget your sunglasses and a big smile!";
  }
  if (lowerMain.includes('rain')) {
    return "Rain check! Grab your umbrella, throw on your coolest rain boots, and go make a splash. Puddle-jumping is basically cardio, right? Bonus points for dramatic slow-mo walks.";
  }
  if (lowerMain.includes('snow')) {
    return "Snowball fight, anyone? Bundle up in your fluffiest gear, channel your inner snow ninja, and don't forget to make the world's cutest snowperson. Hot cocoa is mandatory afterwards!";
  }
  if (lowerMain.includes('drizzle')) {
    return "It's a light drizzle—just enough to make you feel like the main character in a moody indie film. Bring a hoodie, keep your head up, and maybe snap some aesthetic rainy-day pics.";
  }
  if (lowerMain.includes('thunder')) {
    return "Thunderstorm alert! Time to get cozy, binge your favorite show, and pretend you're in a dramatic movie scene. Bonus: perfect excuse for snacks and fuzzy blankets.";
  }
  if (lowerMain.includes('cloud')) {
    return "Cloudy vibes incoming. Great day for a chill playlist, deep convos, or a walk where you pretend you're in a music video. The sun's just playing hide and seek!";
  }
  if (lowerMain.includes('wind')) {
    return "Hold onto your hat! It's a blustery day—perfect for dramatic hair flips, flying kites, or just letting the wind give you that windswept look. Secure your snacks and style!";
  }
  if (humidity > 80) {
    return "Humidity's on beast mode! It's a hair-don't day, so hydrate, rock that messy bun, and treat yourself to something icy. Your skin loves it, your hair… not so much.";
  }
  if (temp_max <= 10) {
    return "Brrr! It's cold enough to see your breath—layer up, grab a hot drink, and channel your inner cozy-core. Scarves, mittens, and dramatic shivers highly encouraged.";
  }
  if (wind > 10) {
    return "Wind's up! Secure your snacks, double-knot those laces, and get ready for some accidental wind sprints. Bonus: instant volume for your hair!";
  }
  return "Whatever the weather, you're the main character. Go make today legendary—rain, shine, or anything in between!";
}

export function getWeatherConditionIcon(main: string): string {
  const lowerMain = main.toLowerCase();
  if (lowerMain.includes('clear') || lowerMain.includes('sun')) return '☀️';
  if (lowerMain.includes('cloud')) return '☁️';
  if (lowerMain.includes('rain')) return '🌧️';
  if (lowerMain.includes('snow')) return '❄️';
  if (lowerMain.includes('drizzle')) return '🌦️';
  if (lowerMain.includes('thunder')) return '⛈️';
  if (lowerMain.includes('fog') || lowerMain.includes('mist') || lowerMain.includes('haze')) return '🌫️';
  if (lowerMain.includes('wind')) return '💨';
  return '🌡️';
}

export function getFiveDaySummaries(forecast: OWMForecast): Array<{ day: string; high: number; low: number; main: string; description: string }> {
  // Group forecast items by day
  const days: { [date: string]: OWMForecastItem[] } = {};
  forecast.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push(item);
  });
  // Exclude today
  const today = new Date().toISOString().split('T')[0];
  const filteredDays = Object.entries(days)
    .filter(([date]) => date !== today)
    .slice(0, 5);
  // For each day, pick the most common weather main, and get min/max
  return filteredDays.map(([date, items]) => {
    const mainCounts: { [main: string]: number } = {};
    let mostCommonMain = '';
    let mostCommonDesc = '';
    let maxCount = 0;
    items.forEach(item => {
      const main = item.weather[0].main;
      mainCounts[main] = (mainCounts[main] || 0) + 1;
      if (mainCounts[main] > maxCount) {
        mostCommonMain = main;
        mostCommonDesc = item.weather[0].description;
        maxCount = mainCounts[main];
      }
    });
    return {
      day: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      high: Math.round(Math.max(...items.map(i => i.main.temp_max))),
      low: Math.round(Math.min(...items.map(i => i.main.temp_min))),
      main: mostCommonMain,
      description: mostCommonDesc
    };
  });
} 