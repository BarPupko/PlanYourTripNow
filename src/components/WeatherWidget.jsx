import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, MapPin, Search } from 'lucide-react';
import colors from '../utils/colors';

const WeatherWidget = ({ compact = false }) => {
  const [location, setLocation] = useState('New York');
  const [locationInput, setLocationInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // Popular locations
  const popularLocations = ['Toronto', 'Ottawa', 'Barrie','Montreal','Mont Tremblant ','Chicago','New York', 'Miami',  'Boston'];

  useEffect(() => { 
    fetchWeather(location);
  }, [location]);

  const fetchWeather = async (city) => {
    setLoading(true);
    setError(null);

    try {
      // Using Open-Meteo API (free, no API key required)
      // First, get coordinates for the city using geocoding
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError('Location not found');
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=mph&timezone=auto&forecast_days=5`
      );
      const weatherData = await weatherResponse.json();

      setWeather({
        city: name,
        country: country,
        temperature: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: Math.round(weatherData.current.wind_speed_10m),
        weatherCode: weatherData.current.weather_code
      });

      // Set forecast for next 5 days
      const forecastData = weatherData.daily.time.map((date, index) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        weatherCode: weatherData.daily.weather_code[index]
      }));

      setForecast(forecastData);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setShowSearch(false);
    setLocationInput('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      handleLocationChange(locationInput.trim());
    }
  };

  const getWeatherIcon = (code) => {
    // WMO Weather interpretation codes
    if (code === 0 || code === 1) return <Sun className="w-8 h-8" style={{ color: '#FCD34D' }} />;
    if (code === 2 || code === 3) return <Cloud className="w-8 h-8" style={{ color: '#9CA3AF' }} />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8" style={{ color: '#60A5FA' }} />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-8 h-8" style={{ color: '#93C5FD' }} />;
    if (code >= 80) return <CloudRain className="w-8 h-8" style={{ color: '#3B82F6' }} />;
    return <Cloud className="w-8 h-8" style={{ color: '#9CA3AF' }} />;
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80) return 'Rain showers';
    return 'Cloudy';
  };

  // Compact mobile version
  if (compact && weather && !loading && !error) {
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="scale-75">
              {getWeatherIcon(weather.weatherCode)}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{weather.temperature}°C</div>
              <div className="text-xs text-gray-600">{weather.city}</div>
            </div>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Change location"
          >
            <Search className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {showSearch && (
          <div className="mt-3 space-y-2">
            <form onSubmit={handleSearchSubmit} className="flex gap-1">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter city..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
              <button
                type="submit"
                style={{ backgroundColor: colors.primary.teal }}
                className="px-3 py-1 text-white rounded text-xs"
              >
                Go
              </button>
            </form>
            <div className="flex flex-wrap gap-1">
              {popularLocations.slice(0, 5).map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc)}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Cloud className="w-5 h-5" style={{ color: colors.primary.teal }} />
          Weather
        </h2>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Change location"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Location Search */}
      {showSearch && (
        <div className="mb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              style={{ backgroundColor: colors.primary.teal }}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Search
            </button>
          </form>

          {/* Popular Locations */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Popular locations:</p>
            <div className="flex flex-wrap gap-2">
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationChange(loc)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Location */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4" style={{ color: colors.primary.teal }} />
        <span className="text-sm font-medium text-gray-700">
          {weather ? `${weather.city}, ${weather.country}` : location}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">Loading weather...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <div className="text-red-500 text-sm">{error}</div>
          <button
            onClick={() => fetchWeather(location)}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Current Weather */}
      {weather && !loading && !error && (
        <>
          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
            <div>
              <div className="text-4xl font-bold text-gray-900">{weather.temperature}°C</div>
              <div className="text-sm text-gray-600 mt-1">
                {getWeatherDescription(weather.weatherCode)}
              </div>
            </div>
            <div>
              {getWeatherIcon(weather.weatherCode)}
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Wind</div>
                <div className="text-sm font-semibold text-gray-900">{weather.windSpeed} mph</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Humidity</div>
                <div className="text-sm font-semibold text-gray-900">{weather.humidity}%</div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">5-Day Forecast</h3>
            <div className="space-y-2">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="scale-75">
                      {getWeatherIcon(day.weatherCode)}
                    </div>
                    <span className="text-xs text-gray-700">{day.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{day.maxTemp}°</span>
                    <span className="text-sm text-gray-500">{day.minTemp}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
