import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';
import Loader from '@/components/Loader/Loader';
import { weatherCodeHeadlines } from './weatherCodeDescriptions';
import { API, INTERVALS } from '@/config';
import Sunrise from '@/assets/wi-sunrise.svg?react';
import Sunset from '@/assets/wi-sunset.svg?react';
import High from '@/assets/wi-thermometer.svg?react';
import Low from '@/assets/wi-thermometer-exterior.svg?react';
import './Weather.scss';

// 360 degrees divided by 16 directions (last value repeats N for wrap-around)
const WIND_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];


//////////////////////////////////////
// CONVERSIONS
const toFahrenheit = (celsius) => ((celsius * 9) / 5 + 32).toFixed(1);
const toMPH = (kmh) => (kmh * 0.621371).toFixed(1);
const toCardinal = (degrees) => WIND_DIRECTIONS[Math.round((degrees % 360) / 22.5)];
const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toInHg = (hPa) => hPa / 33.8639;

const pressureTrend = (deltaInHg) => {
  if (deltaInHg > 0.02) return 'rising';
  if (deltaInHg < -0.02) return 'falling';
  return 'steady';
};

const humidityCategory = (humidity) => {
  if (humidity < 30) return 'low';
  if (humidity < 60) return 'comfortable';
  if (humidity < 70) return 'moderate';
  return 'high';
};

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  //////////////////////////////////////
  // WEATHER FETCHING
  // weather icons here: https://erikflowers.github.io/weather-icons/
  const fetchWeather = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${API.WEATHER}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max&hourly=surface_pressure,relative_humidity_2m&past_hours=3&forecast_hours=1&timezone=auto`
      );

      const { temperature, windspeed, winddirection, weathercode, time: currentTime } = response.data.current_weather;
      const daily = response.data.daily;
      const hourly = response.data.hourly;

      // Find the hourly index closest to the current_weather timestamp
      const currentHourIdx = Math.max(0, hourly.time.findIndex((t) => t === currentTime));
      const pastHourIdx = Math.max(0, currentHourIdx - 3);
      const pressureHpaNow = hourly.surface_pressure[currentHourIdx];
      const pressureHpaPast = hourly.surface_pressure[pastHourIdx];
      const pressureInHgNow = toInHg(pressureHpaNow);
      const pressureDeltaInHg = toInHg(pressureHpaNow - pressureHpaPast);
      const humidity = hourly.relative_humidity_2m[currentHourIdx];

      setWeatherData({
        currentTempF: toFahrenheit(temperature),
        highTempF: toFahrenheit(daily.temperature_2m_max[0]),
        lowTempF: toFahrenheit(daily.temperature_2m_min[0]),
        weatherCode: weathercode,
        windSpeedMph: toMPH(windspeed),
        windDirection: toCardinal(winddirection),
        windGustsMph: daily.wind_gusts_10m_max[0] ? toMPH(daily.wind_gusts_10m_max[0]) : 'N/A',
        sunrise: formatTime(daily.sunrise[0]),
        sunset: formatTime(daily.sunset[0]),
        pressureInHg: pressureInHgNow.toFixed(2),
        pressureTrend: pressureTrend(pressureDeltaInHg),
        humidity: Math.round(humidity),
        humidityCategory: humidityCategory(humidity),
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Unable to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////
  // LOCATION FETCHING
  const getLocation = () => {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchWeather(coords.latitude, coords.longitude),
      (err) => {
        if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
          console.warn('Retrying to get location...');
          // Retry after 5 seconds
          setTimeout(getLocation, 5000);
        } else {
          console.error('Error getting location:', err.message);
        }
      }
    );
  };

  const debouncedGetLocation = debounce(getLocation, 5000);


  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    debouncedGetLocation();
    // Update the weather every 30 minutes
    const interval = setInterval(debouncedGetLocation, INTERVALS.WEATHER_REFRESH);
    return () => clearInterval(interval);
  }, []);

  const headline = weatherData
    ? weatherCodeHeadlines[weatherData.weatherCode] || 'Look Outside'
    : '';


  //////////////////////////////////////
  // RENDER
  return (
    <section className="weather">
      {loading ? (
        <Loader />
      ) : (
        <div className="box">
          {error && <p className="error">{error}</p>}
          {weatherData && (
            <div className="text">
              <div className="currentTemp">{weatherData.currentTempF}°</div>
              <div className="headline">{headline}</div>
              <div className="wind">
                Wind <strong>{weatherData.windDirection}</strong> at <strong>{weatherData.windSpeedMph} mph</strong> gusting to <strong>{weatherData.windGustsMph} mph</strong>.
              </div>
              <div className="pressureHumidity">
                Pressure <strong>{weatherData.pressureInHg} inHg</strong> {weatherData.pressureTrend} · Humidity <strong>{weatherData.humidity}%</strong> ({weatherData.humidityCategory})
              </div>
              <div className="dataRow">
                <span>
                  <Sunrise className="icon" />
                  <h6>sunrise</h6>
                  <p>{weatherData.sunrise}</p>
                </span>
                <span>
                  <Sunset className="icon" />
                  <h6>sunset</h6>
                  <p>{weatherData.sunset}</p>
                </span>
                <span>
                  <High className="icon" />
                  <h6>High:</h6>
                  <p>{weatherData.highTempF}°F</p>
                </span>
                <span>
                  <Low className="icon" />
                  <h6>Low:</h6>
                  <p>{weatherData.lowTempF}°F</p>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Weather;
