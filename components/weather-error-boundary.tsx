"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WeatherBuddyIcon } from './ui/weathericon';

interface WeatherErrorBoundaryProps {
    children: ReactNode;
}

interface WeatherErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    retryCount: number;
}

export class WeatherErrorBoundary extends Component<WeatherErrorBoundaryProps, WeatherErrorBoundaryState> {
    constructor(props: WeatherErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, retryCount: 0 };
    }

    static getDerivedStateFromError(error: Error): Partial<WeatherErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('WeatherErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: undefined,
            retryCount: prevState.retryCount + 1
        }));
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <WeatherBuddyIcon name="weather" className="w-16 h-16 mx-auto text-red-500 mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Weather Service Unavailable
                            </h1>
                            <p className="text-gray-600 mb-6">
                                We&apos;re having trouble loading weather data right now. This might be due to:
                            </p>
                            <ul className="text-sm text-gray-500 text-left space-y-1 mb-6">
                                <li>• Temporary network issues</li>
                                <li>• Weather service maintenance</li>
                                <li>• High server load</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={this.handleRefresh}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>

                        {this.state.retryCount > 0 && (
                            <p className="text-xs text-gray-400 mt-4">
                                Retry attempt: {this.state.retryCount}
                            </p>
                        )}

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Error Details (Development)
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-32">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component for easier usage
export function withWeatherErrorBoundary<P extends object>(
    Component: React.ComponentType<P>
) {
    return function WrappedComponent(props: P) {
        return (
            <WeatherErrorBoundary>
                <Component {...props} />
            </WeatherErrorBoundary>
        );
    };
} 