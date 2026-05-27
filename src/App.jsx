import { useState, useEffect } from 'react';
import './App.css';

const WEATHER_CODES = {
  0: '☀️ 晴天',
  1: '🌤️ 少云', 2: '⛅ 多云', 3: '☁️ 阴天',
  45: '🌫️ 雾', 48: '🌫️ 雾凇',
  51: '🌧️ 小雨', 53: '🌧️ 中雨', 55: '🌧️ 大雨',
  61: '🌧️ 阵雨', 63: '🌧️ 中阵雨', 65: '🌧️ 大阵雨',
  71: '🌨️ 小雪', 73: '🌨️ 中雪', 75: '🌨️ 大雪',
  80: '🌦️ 阵雨', 81: '🌦️ 中阵雨', 82: '🌦️ 大阵雨',
  95: '⛈️ 雷暴', 96: '⛈️ 雷暴+冰雹', 99: '⛈️ 强雷暴',
};

export default function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    search('北京');
  }, []);

  async function search(query) {
    setLoading(true);
    setError('');
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=zh`
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        setError('找不到这个城市');
        setLoading(false);
        return;
      }
      const { name, country, latitude, longitude } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=5`
      );
      const weatherData = await weatherRes.json();

      setWeather({
        city: name,
        country,
        current: {
          temp: Math.round(weatherData.current_weather.temperature),
          code: weatherData.current_weather.weathercode,
          wind: weatherData.current_weather.windspeed,
        },
        daily: weatherData.daily.time.map((date, i) => ({
          date,
          max: Math.round(weatherData.daily.temperature_2m_max[i]),
          min: Math.round(weatherData.daily.temperature_2m_min[i]),
          code: weatherData.daily.weathercode[i],
        })),
      });
    } catch {
      setError('网络请求失败，请重试');
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = city.trim();
    if (trimmed) search(trimmed);
  }

  return (
    <div className="app">
      <header>
        <h1>天气</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="输入城市名..."
          />
          <button type="submit">搜索</button>
        </form>
      </header>

      {loading && <div className="loading">查询中...</div>}
      {error && <div className="error">{error}</div>}

      {weather && !loading && (
        <div className="result">
          <div className="current-card">
            <p className="location">{weather.city}, {weather.country}</p>
            <div className="current-main">
              <span className="current-temp">{weather.current.temp}°</span>
              <span className="current-desc">{WEATHER_CODES[weather.current.code] || '未知'}</span>
            </div>
            <p className="current-wind">风速 {weather.current.wind} km/h</p>
          </div>

          <div className="forecast">
            {weather.daily.map((day) => (
              <div key={day.date} className="forecast-day">
                <span className="day-label">
                  {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                </span>
                <span className="day-icon">{WEATHER_CODES[day.code]?.split(' ')[0] || '🌤️'}</span>
                <span className="day-temps">{day.max}° <span className="low">{day.min}°</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
