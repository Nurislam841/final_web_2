document.addEventListener('DOMContentLoaded', () => {
    let map;
    let marker;

    function initializeMap(lat, lon) {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 10);
        }

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup(`<b>Location:</b> [${lat}, ${lon}]`).openPopup();
    }

    async function getWeather() {
        const city = document.getElementById('city').value.trim();
        if (!city) {
            alert('Please enter a city name.');
            return;
        }

        try {
            const responses = await Promise.allSettled([
                fetch(`/api/weather?city=${city}`),
                fetch(`/api/news?city=${city}`),
                fetch(`/api/weather/forecast?city=${city}`),
                fetch(`/api/air-quality?city=${city}`)
            ]);

            const [weatherRes, newsRes, forecastRes, airQualityRes] = responses.map(res => res.status === 'fulfilled' ? res.value : null);

            if (!weatherRes?.ok) throw new Error('Failed to fetch weather data');
            if (!forecastRes?.ok) throw new Error('Failed to fetch forecast data');
            if (!airQualityRes?.ok) throw new Error('Failed to fetch air quality data');

            const weatherData = await weatherRes.json();
            const forecastData = await forecastRes.json();
            const airQualityData = await airQualityRes.json();
            const newsData = newsRes?.ok ? await newsRes.json() : [];

            document.getElementById('weather').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h2 class="card-title">Weather in ${city}</h2>
                        <p>Temperature: ${weatherData.temperature}°C</p>
                        <p>Description: ${weatherData.description}</p>
                        <p>Feels like: ${weatherData.feels_like}°C</p>
                        <p>Humidity: ${weatherData.humidity}%</p>
                        <p>Pressure: ${weatherData.pressure} hPa</p>
                        <p>Wind Speed: ${weatherData.wind_speed} m/s</p>
                        <p>Rain Volume: ${weatherData.rain_volume} mm</p>
                        <img src="${weatherData.icon}" alt="Weather icon">
                    </div>
                </div>
            `;

            document.getElementById('stats').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">News in ${city}</h3>
                        ${newsData.length ? newsData.map(article => `
                            <p><strong>${article.title}</strong><br>${article.description}</p>
                        `).join('') : '<p>No news available.</p>'}
                    </div>
                </div>
                <div class="card mt-3">
                    <div class="card-body">
                        <h3 class="card-title">Air Quality</h3>
                        <p><strong>Index:</strong> ${airQualityData.air_quality_index}</p>
                        <p><strong>Status:</strong> ${airQualityData.message}</p>
                    </div>
                </div>
            `;

            document.getElementById('forecast').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title">5-Day Forecast</h3>
                        <ul class="list-group">
                            ${forecastData.map(day => `
                                <li class="list-group-item">
                                    <strong>${day.date}:</strong> ${day.temperature}°C, ${day.description}
                                    <img src="${day.icon}" alt="Weather icon">
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;

            initializeMap(weatherData.coordinates.lat, weatherData.coordinates.lon);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data. Please try again.');
        }
    }

    window.getWeather = getWeather;
});
