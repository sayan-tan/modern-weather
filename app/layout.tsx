import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Caveat, Slabo_13px } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const slabo13px = Slabo_13px({
  variable: "--font-slabo-13px",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Weather Buddy - Real-time Weather Dashboard",
    template: "%s | Weather Buddy"
  },
  description: "Get accurate real-time weather forecasts, air quality data, and detailed city information. Features 5-day forecasts, hourly predictions, and comprehensive weather insights for any location worldwide.",
  keywords: [
    "weather",
    "forecast",
    "weather app",
    "weather dashboard",
    "real-time weather",
    "air quality",
    "weather forecast",
    "temperature",
    "humidity",
    "wind speed",
    "weather conditions",
    "weather API",
    "weather data",
    "weather information",
    "local weather",
    "weather radar",
    "weather maps",
    "weather alerts"
  ],
  authors: [{ name: "Weather Buddy Team" }],
  creator: "Weather Buddy",
  publisher: "Weather Buddy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://weather-buddy.app'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://weather-buddy.app',
    siteName: 'Weather Buddy',
    title: 'Weather Buddy - Real-time Weather Dashboard',
    description: 'Get accurate real-time weather forecasts, air quality data, and detailed city information. Features 5-day forecasts, hourly predictions, and comprehensive weather insights for any location worldwide.',
    images: [
      {
        url: '/weather/sunny.jpg',
        width: 1200,
        height: 630,
        alt: 'Weather Buddy - Modern Weather Dashboard',
        type: 'image/jpeg',
      },
      {
        url: '/weather/cloudy.jpg',
        width: 1200,
        height: 630,
        alt: 'Weather Buddy - Cloudy Weather View',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weather Buddy - Real-time Weather Dashboard',
    description: 'Get accurate real-time weather forecasts, air quality data, and detailed city information. Features 5-day forecasts, hourly predictions, and comprehensive weather insights.',
    images: ['/weather/sunny.jpg'],
    creator: '@weatherbuddy',
    site: '@weatherbuddy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'weather',
  classification: 'weather application',
  other: {
    'application-name': 'Weather Buddy',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Weather Buddy',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#ffffff',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${slabo13px.variable} antialiased`}
        style={{ fontFamily: 'Lato, var(--font-geist-sans), var(--font-geist-mono), var(--font-caveat), var(--font-slabo-13px), sans-serif' }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Weather Buddy",
              "description": "Real-time weather dashboard with forecasts, air quality data, and city information",
              "url": "https://weather-buddy.app",
              "applicationCategory": "WeatherApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Weather Buddy Team"
              },
              "featureList": [
                "Real-time weather data",
                "5-day weather forecast",
                "Hourly weather predictions",
                "Air quality index",
                "City information",
                "Weather alerts",
                "Temperature, humidity, wind speed",
                "Weather conditions and icons"
              ],
              "screenshot": "https://weather-buddy.app/weather/sunny.jpg",
              "softwareVersion": "1.0.0"
            })
          }}
        />
        {children}
      </body>
    </html>
  );
}