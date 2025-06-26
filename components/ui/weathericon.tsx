import React from 'react';
import {
  SunLight,
  Cloud,
  Rain,
  HeavyRain,
  Snow,
  SnowFlake,
  Fog,
  Thunderstorm,
  Wind,
  Droplet,
  MapPin,
  Search,
  Eye,
  WarningCircle,
  Emoji,
  Clock,
  HalfMoon,
  Navigator,
  Gps,
  ArrowUpRight,
  ArrowDownLeft,
  Globe,
  Leaf,
  Flask,
  Atom,
  Shield,
  // Add more as needed
} from 'iconoir-react';

// Weather-specific icon component using Iconoir
export const WeatherIcon: React.FC<{ condition: string; size?: string; className?: string }> = ({ condition, size = '2rem', className = '' }) => {
  // Map your new icon names to the correct icon components
  const icons: Record<string, React.ElementType> = {
    'sun-light': SunLight,
    'cloud-sunny': Cloud,
    'cloud': Cloud,
    'rain': Rain,
    'heavy-rain': HeavyRain,
    'snow': Snow,
    'snow-flake': SnowFlake,
    'fog': Fog,
    'thunderstorm': Thunderstorm,
    'wind': Wind,
    // fallback
    'default': Cloud,
  };

  const iconKey = condition in icons ? condition : 'default';
  const IconComponent = icons[iconKey];
  return <IconComponent width={size} height={size} className={className} />;
};

export const LocationIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <MapPin width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const HumidityIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Droplet width="1.5rem" height="1.5rem" className={className} color={color} />
);

export const WindIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Wind width="1.5rem" height="1.5rem" className={className} color={color} />
);

export const VisibilityIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Eye width="1.5rem" height="1.5rem" className={className} color={color} />
);

export const ThermometerIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Droplet width="1.5rem" height="1.5rem" className={className} color={color} />
);

export const AlertIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <WarningCircle width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const HappyIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Emoji width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const TimeIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Clock width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const MoonIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <HalfMoon width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const NavigationIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Navigator width="1.25rem" height="1.25rem" className={className} color={color} />
);

export const CurrentLocationIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Gps width="1.5rem" height="1.5rem" className={className} color={color} />
);

export const WikipediaIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Globe width="1.25rem" height="1.25rem" className={className} color={color} />
);

// Generic Iconoir wrapper for dynamic icon selection (replaces Boxicon)
export const IconoirIcon = ({ name, size = '1.5rem', color, className = '', ...props }: {
  name: string;
  size?: string;
  color?: string;
  className?: string;
  [key: string]: unknown;
}) => {
  const icons: Record<string, React.ElementType> = {
    'bx-sun': SunLight,
    'bx-cloud': Cloud,
    'bx-cloud-rain': Rain,
    'bx-cloud-snow': Snow,
    'bx-cloud-drizzle': Cloud,
    'bx-cloud-lightning': Cloud,
    'bx-wind': Wind,
    'bx-droplet': Droplet,
    'bx-thermometer': Droplet,
    'bx-map-pin': MapPin,
    'bx-search': Search,
    'bx-show': Eye,
    'bx-error-circle': WarningCircle,
    'bx-happy-alt': Emoji,
    'bx-time': Clock,
    'bx-moon': HalfMoon,
    'bx-navigation': Navigator,
    'bx-current-location': Gps,
  };
  const Icon = icons[name] || SunLight;
  return <Icon width={size} height={size} color={color} className={className} {...props} />;
};

// Alias for use in Weather Buddy
export const WeatherBuddyIcon = IconoirIcon;

export const ArrowUpRightIcon: React.FC<{ className?: string; color?: string; size?: string }> = ({ className = '', color, size = '1rem' }) => (
  <ArrowUpRight width={size} height={size} className={className} color={color} />
);

export const ArrowDownLeftIcon: React.FC<{ className?: string; color?: string; size?: string }> = ({ className = '', color, size = '1rem' }) => (
  <ArrowDownLeft width={size} height={size} className={className} color={color} />
);

// Pollutant icon mapping
export const getPollutantIcon = (pollutant: string) => {
  switch (pollutant.toLowerCase()) {
    case 'pm25':
    case 'pm2.5':
    case 'pm10':
      return Atom;
    case 'o3':
      return Leaf;
    case 'no2':
    case 'so2':
      return Flask;
    case 'co':
      return Shield;
    default:
      return Shield;
  }
};

export const SearchIcon: React.FC<{ className?: string; color?: string }> = ({ className = '', color }) => (
  <Search width="1.25rem" height="1.25rem" className={className} color={color} />
); 