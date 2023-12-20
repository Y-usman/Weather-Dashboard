// Constants for API

const openWeatherMapBaseURL = 'https://api.openweathermap.org/data/2.5/forecast';
const openWeatherMapApiKey =  '11966dd3c33cf5ecf3805c098283bfbf';

const iconMappings = {
  "01d": "wb_sunny",      // clear sky
  "02d": "wb_cloudy",     // few clouds
  "03d": "cloud",         // scattered clouds
  "04d": "cloud_queue",   // broken clouds
  "09d": "umbrella",      // shower rain
  "10d": "beach_access",  // rain
  "11d": "flash_on",      // thunderstorm
  "13d": "ac_unit",       // snow
  "50d": "blur_on",       // mist
  "01n": "night_clear",        // clear sky (night)
  "02n": "night_cloudy",       // few clouds (night)
  "03n": "night_cloud",        // scattered clouds (night)
  "04n": "night_cloud_queue",  // broken clouds (night)
  "09n": "night_showers",      // shower rain (night)
  "10n": "night_rain",         // rain (night)
  "11n": "night_thunderstorm", // thunderstorm (night)
  "13n": "night_snow",         // snow (night)
  "50n": "night_fog",          // mist (night)

};

// Function to get user's current location
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error => reject(error)
    );
  });
}

// Function to get coordinates from the Geocoding API
async function getCoordinates(cityName) {
    const geocodingAPIKey = openWeatherMapAPIKey; 
    const geocodingAPIURL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${geocodingAPIKey}`;
  
    try {
      const response = await fetch(geocodingAPIURL);
      const data = await response.json();
  
      console.log('Geocoding API Response:', data); 
  
      if (data.length > 0) {
        const { lat, lon } = data[0];
        console.log('Latitude:', lat, 'Longitude:', lon); 
        return { lat, lon };
      } else {
        throw new Error('Invalid city name');
      }
    } catch (error) {
      throw new Error('Error fetching coordinates');
    }
}

// Function to get weather forecast from OpenWeatherMap API
async function getWeatherForecast(lat, lon) {
    const apiURL = `${openWeatherMapBaseURL}?lat=${lat}&lon=${lon}&appid=${openWeatherMapAPIKey}`;
  
    try {
      const response = await fetch(apiURL);
      const data = await response.json();
      console.log('OpenWeatherMap API Response:', data); 
      return data;
    } catch (error) {
      throw new Error('Error fetching weather data');
    }
}

// Function to update the UI with weather data
function updateWeatherUI(weatherData) {
    try {
      const currentConditions = weatherData.list[0];
  
      // Convert temperature from Kelvin to Celsius
      const temperatureCelsius = currentConditions.main.temp - 273.15;
  
      // Update current conditions UI
      document.getElementById('today').innerHTML = `
        <h2>${weatherData.city.name}, ${weatherData.city.country}</h2>
        <p>Date: ${new Date(currentConditions.dt * 1000).toLocaleDateString()}</p>
        <p>Temperature: ${temperatureCelsius.toFixed(1)} °C</p>
        <p>Humidity: ${currentConditions.main.humidity} %</p>
        <p>Wind Speed: ${currentConditions.wind.speed} m/s</p>
        <i class="material-icons">${iconMappings[currentConditions.weather[0].icon]}</i>
      `;
  
      // Update 5-day forecast UI
      const forecastContainer = document.getElementById('forecast');
      forecastContainer.innerHTML = '';
  
      for (let i = 1; i < 6; i++) {
        const forecast = weatherData.list[i * 8];
  
        if (forecast) {
          // Convert temperature from Kelvin to Celsius
          const forecastTemperatureCelsius = forecast.main.temp - 273.15;
  
          forecastContainer.innerHTML += `
            <div class="col">
              <h3>${new Date(forecast.dt * 1000).toLocaleDateString()}</h3>
              <p>Temperature: ${forecastTemperatureCelsius.toFixed(1)} °C</p>
              <p>Humidity: ${forecast.main.humidity} %</p>
              <i class="material-icons">${iconMappings[forecast.weather[0].icon]}</i>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error updating UI:', error);
    }
}

// Function to save data to localStorage
function saveToLocalStorage(key, value) {
  const existingData = localStorage.getItem(key);

  const newData = existingData ? JSON.parse(existingData) : [];
  newData.push(value);

  localStorage.setItem(key, JSON.stringify(newData));
  updateSearchHistoryUI(newData);
}

function updateSearchHistoryUI(searchHistory) {
  const historyContainer = document.getElementById('history');
  historyContainer.innerHTML = '';

  searchHistory.forEach(city => {
    const button = document.createElement('button');
    button.textContent = city;
    historyContainer.appendChild(button);
  });
}

// Function to display the weather for the user's current location
async function displayWeatherForCurrentLocation() {
  try {
    const currentPosition = await getCurrentLocation();
    console.log('Current Position:', currentPosition);
    const weatherData = await getWeatherForecast(currentPosition.latitude, currentPosition.longitude);
    updateWeatherUI(weatherData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Event listener for form submission
document.getElementById('search-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  const cityName = document.getElementById('search-input').value.trim();
  
  try {
    let coordinates;
    if (cityName) {
      coordinates = await getCoordinates(cityName);
    } else {
      coordinates = await getCurrentLocation();
    }

    const weatherData = await getWeatherForecast(coordinates.lat, coordinates.lon);
    updateWeatherUI(weatherData);

    if (cityName) {
      saveToLocalStorage('searchHistory', cityName);
      document.getElementById('search-input').value = '';
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

// Event listener for clicking on a city in the search history
document.getElementById('history').addEventListener('click', async function (event) {
  if (event.target.matches('button')) {
    const cityName = event.target.textContent;

    try {
      const coordinates = await getCoordinates(cityName);
      const weatherData = await getWeatherForecast(coordinates.lat, coordinates.lon);
      updateWeatherUI(weatherData);
    } catch (error) {
      console.error('Error:', error);
    }
  }
});

// Display weather for the user's current location when the page is loaded
displayWeatherForCurrentLocation();
