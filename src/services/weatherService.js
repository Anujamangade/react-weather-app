import { DateTime } from "luxon";

const API_KEY = "bfb5c28e14a564914884ab743b752000";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const getWeatherData = (infoType, searchParams) => {
  const url = new URL(BASE_URL + "/" + infoType);
  url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });

  return fetch(url).then((res) => res.json());
};

const formatCurrentWeather = (data) => {
  const {
    coord: { lat, lon },
    main: { temp, feels_like, temp_min, temp_max, humidity },
    name,
    dt,
    sys: { country, sunrise, sunset },
    weather,
    wind: { speed },
  } = data;

  const { main: details, icon } = weather[0];

  return {
    lat,
    lon,
    temp,
    feels_like,
    temp_min,
    temp_max,
    humidity,
    name,
    dt,
    country,
    sunrise,
    sunset,
    details,
    icon,
    speed,
  };
};

const formatForecastWeather = (data) => {
  const { timezone, daily, hourly } = data || {};

  if (!Array.isArray(daily) || !Array.isArray(hourly)) {
    console.error("❌ Invalid forecast data received:", data);
    return { timezone: timezone || "Unknown", daily: [], hourly: [] };
  }

  const formattedDaily = daily.slice(1, 6).map((d) => ({
    title: formatToLocalTime(d.dt, timezone, "ccc"),
    temp: d.temp?.day,
    icon: d.weather?.[0]?.icon,
  }));

  const formattedHourly = hourly.slice(1, 6).map((d) => ({
    title: formatToLocalTime(d.dt, timezone, "hh:mm a"),
    temp: d.temp,
    icon: d.weather?.[0]?.icon,
  }));

  return { timezone, daily: formattedDaily, hourly: formattedHourly };
};

const getFormattedWeatherData = async (searchParams) => {
  const formattedCurrentWeather = await getWeatherData(
    "weather",
    searchParams
  ).then(formatCurrentWeather);

  const { lat, lon } = formattedCurrentWeather;

  // ✅ USE v2.5 endpoint directly instead of "onecall"
  const forecastUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,alerts&units=${searchParams.units}&appid=${API_KEY}`;
  const forecastData = await fetch(forecastUrl).then((res) => res.json());
  const formattedForecastWeather = formatForecastWeather(forecastData);

  return { ...formattedCurrentWeather, ...formattedForecastWeather };
};

const formatToLocalTime = (
  secs,
  zone,
  format = "cccc, dd LLL yyyy' | Local time: 'hh:mm a"
) => DateTime.fromSeconds(secs).setZone(zone).toFormat(format);

const iconUrlFromCode = (code) =>
  `https://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
