import { useState, useEffect, useMemo } from 'react';
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



const Weather = () => {

  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);




  //////////////////////////////////////
  // WEATHER INFORMATION
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    // 360 degrees divided by 16 directions
    const index = Math.round((degrees % 360) / 22.5);
    return directions[index];
  };

  const generateWeatherDescription = () => {
    const description = weatherCodeDescriptions[weatherData.weatherCode] || "...I guess look out the window.";
    return `Today you can expect ${description}`;
  };

  


  //////////////////////////////////////
  // CONVERSIONS
  const convertToFahrenheit = (celsius) => ((celsius * 9) / 5 + 32).toFixed(1);
  const convertToMPH = (kmh) =>  (kmh * 0.621371).toFixed(1);





  //////////////////////////////////////
  // WEATHER FETCHING

  // weather icons here: https://erikflowers.github.io/weather-icons/
  const fetchWeather = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${API.WEATHER}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max&timezone=auto`
      );

      //weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_gusts_10m_max

      // console.log(response.data);
      // Extract Current Weather Data
      const { temperature, windspeed, winddirection, weathercode } = response.data.current_weather;
      const currentTempF = convertToFahrenheit(temperature);
      const windSpeedMph = convertToMPH(windspeed);
      
      // Convert degrees to cardinal
      const windDirectionCardinal = getWindDirection(winddirection);
  
      // Extract Daily Weather Data
      const dailyWeather = response.data.daily;
      const highTempF = convertToFahrenheit(dailyWeather.temperature_2m_max[0]);
      const lowTempF = convertToFahrenheit(dailyWeather.temperature_2m_min[0]);
      const sunrise = new Date(dailyWeather.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(dailyWeather.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const windGustsMph = dailyWeather.wind_gusts_10m_max[0] ? convertToMPH(dailyWeather.wind_gusts_10m_max[0]) : "N/A";

      // Consolidate Weather Data
      const data = {
        currentTempF,
        highTempF,
        lowTempF,
        weatherCode: weathercode,
        windSpeedMph,
        windDirection: windDirectionCardinal,
        windGustsMph,
        sunrise,
        sunset,
      };
      
      // Update state with consolidated data
      setWeatherData(data); 
      // Clear any previous errors
      setError(null); 
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setError("Unable to fetch weather data.");
    } finally {
       // Stop displaying Loader
      setLoading(false);
    }
  };
  





  //////////////////////////////////////
  // LOCATION FETCHING
  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // console.log("Location obtained:", position);
          const { latitude, longitude } = position.coords;
          // Fetch weather with user's location
          fetchWeather(latitude, longitude); 
        },
        (error) => {
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            console.warn("Retrying to get location...");
             // Retry after 5 seconds
            setTimeout(getLocation, 5000);
          } else {
            console.error("Error getting location:", error.message);
          }
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const debouncedGetLocation = debounce(getLocation, 5000);
  



  
  //////////////////////////////////////
  // RUN-TIME
  useEffect(() => {
    debouncedGetLocation();

    //update the weather every 30 minutes
    const interval = setInterval(() => {
      debouncedGetLocation();
      //in milliseconds
    }, INTERVALS.WEATHER_REFRESH);
    return () => clearInterval(interval);

  }, []);




  //////////////////////////////////////
  // RENDER
  return (
    <section className="weather">
      {loading ? (
        // Show loader while waiting for location and weather data
        <Loader /> 
      ) : (
        <div className="box">
          {error && <p className="error">{error}</p>}
          {weatherData && (
            <div className="text">
              <div className="currentTemp">{weatherData.currentTempF}°</div>
              <div className="description">{generateWeatherDescription()}</div>
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
