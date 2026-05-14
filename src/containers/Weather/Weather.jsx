import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import axios from 'axios';
import Loader from '@/components/Loader/Loader';
import weatherCodeDescriptions from './weatherCodeDescriptions';
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
        `${API.WEATHER}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max&timezone=auto`
      );

      const { temperature, windspeed, winddirection, weathercode } = response.data.current_weather;
      const daily = response.data.daily;

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

  const description = weatherData
    ? `Today you can expect ${weatherCodeDescriptions[weatherData.weatherCode] || '...I guess look out the window.'}`
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
              <div className="description">{description}</div>
              <div className="wind">
                Wind <strong>{weatherData.windDirection}</strong> at <strong>{weatherData.windSpeedMph} mph</strong> gusting to <strong>{weatherData.windGustsMph} mph</strong>.
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
