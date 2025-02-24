const express = require('express');
const path = require('path');
const axios = require('axios');
const { NewsAPI } = require('newsapi');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/final', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.get('/logReg', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/logReg.html'));
});
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'email already exist' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'register succesfuly' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error register' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'user not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'error password' });
        }

        const token = jwt.sign({ userId: user._id }, '1234', { expiresIn: '1h' });

        res.status(200).json({ message: 'login succes', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'error login' });
    }
});

const QRCode = require('qrcode');

app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'qr2.html'));
});

app.post('/generate-qr', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.send("write text or link");

    try {
        const qrImage = await QRCode.toDataURL(text);
        res.json({ qrImage });
    } catch (error) {
        console.error("error generate QR ", error);
        res.status(500).send("error generate QR");
    }
});

app.get('/BMIail', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/BMIail.html'));
});
app.post('/calculate_BMI', (req, res) => {
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);

    const bmi = weight / (height * height);

    let category = '';
    let categoryClass = '';
    if (bmi < 18.5) {
        category = 'Underweight';
        categoryClass = 'underweight';
    }
    else if (bmi < 24.9) {
        category = 'Normal weight';
        categoryClass = 'normal';
    }
    else if (bmi < 29.9) {
        category = 'Overweight';
        categoryClass = 'overweight';
    }
    else {
        category = 'Obese';
        categoryClass = 'obese';
    }

    res.send(`
        <style>
            .underweight { color: blue; }
            .normal { color: green; }
            .overweight { color: yellow; }
            .obese { color: red; }

            .container {
                text-align: center;
                background-color: #fff;
                padding: 60px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                width: 300px;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            a {
                background-color:rgb(76, 87, 175);
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        </style>
        <body>
            <div class="container">
                <h1>Your BMI is ${bmi.toFixed(2)}</h1>
                <h2>Category: <span class="${categoryClass}">${category}</span></h2>
                <br><br>
                <a href="BMIail.html">Go back</a>
            </div>
        </body>
    `);
});
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "nurisaitu2@gmail.com",
        pass: "jqan gzxe oqmp xeky"
    }
});

app.post('/send-email', async (req, res) => {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
        return res.status(400).json({ error: 'To, subject, and message are required!' });
    }

    const mailOptions = {
        from: "nurisaitu2@gmail.com",
        to,
        subject,
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send(`
            <style>
                .container {
                    text-align: center;
                    background-color: #fff;
                    padding: 60px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    width: 300px;
                }
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                a {
                    background-color:rgb(76, 87, 175);
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
            <body>
                <div class="container">
                    <h1>Email sent successfully!</h1>
                    <br><br>
                    <a href="BMIail.html">Go back</a>
                </div>
            </body>
        `);
    } catch (error) {
        res.send(`
            <style>
                .container {
                    text-align: center;
                    background-color: #fff;
                    padding: 60px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    width: 300px;
                }
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                a {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
            <body>
                <div class="container">
                    <h1>Error sending email!</h1>
                    <p>${error.message}</p>
                    <br><br>
                    <a href="BMIail.html">Go back</a>
                </div>
            </body>
        `);
    }
});

const AIR_QUALITY_API_KEY = '202dc101dbf3dec69263a26228975950';
const OPENWEATHER_API_KEY = '75d3539088c987046a59447c80e661f4';
const NEWS_API_KEY = '34fc83f27fe3403b8262b3878ef23cb3';

app.get('/weather', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/weather.html'));
});

app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );

        if (!response.data) throw new Error('Invalid response from OpenWeather API');

        const { coord, main, weather, wind, sys, rain } = response.data;
        res.json({
            temperature: main.temp,
            description: weather[0].description,
            icon: `https://openweathermap.org/img/wn/${weather[0].icon}.png`,
            coordinates: coord,
            feels_like: main.feels_like,
            humidity: main.humidity,
            pressure: main.pressure,
            wind_speed: wind.speed,
            country_code: sys.country,
            rain_volume: rain ? rain['3h'] || 0 : 0,
        });
    } catch (error) {
        console.error('Weather API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});
app.get('/api/news', async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        const geoResponse = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${OPENWEATHER_API_KEY}`
        );

        if (!geoResponse.data.length) {
            return res.status(404).json({ error: 'City not found' });
        }

        const { country } = geoResponse.data[0];

        const newsResponse = await axios.get(
            `https://newsapi.org/v2/everything?q=${city}&apiKey=${NEWS_API_KEY}`
        );

        res.json(newsResponse.data.articles.slice(0, 5)); // Return top 5 articles
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/api/weather/forecast', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );

        if (!response.data || !response.data.list) throw new Error('Invalid forecast data');

        const dailyForecasts = response.data.list
            .filter((_, index) => index % 8 === 0)
            .map(item => ({
                date: item.dt_txt.split(' ')[0],
                temperature: item.main.temp,
                description: item.weather[0].description,
                icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
            }));

        res.json(dailyForecasts);
    } catch (error) {
        console.error('Forecast API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather forecast' });
    }
});

app.get('/api/air-quality', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        const geoResponse = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${OPENWEATHER_API_KEY}`
        );

        if (!geoResponse.data.length) return res.status(404).json({ error: 'City not found' });

        const { lat, lon } = geoResponse.data[0];

        const airResponse = await axios.get(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${AIR_QUALITY_API_KEY}`
        );

        if (!airResponse.data || !airResponse.data.list) throw new Error('Invalid air quality data');

        const airQualityIndex = airResponse.data.list[0].main.aqi;
        res.json({
            city,
            air_quality_index: airQualityIndex,
            message: getAirQualityMessage(airQualityIndex),
        });
    } catch (error) {
        console.error('Air Quality API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
});

function getAirQualityMessage(aqi) {
    const messages = [
        'Unknown',
        'Good',
        'Fair',
        'Moderate',
        'Poor',
        'Very Poor'
    ];
    return messages[aqi] || messages[0];
}

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/blog.html'));
});

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: String,
    createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model("Blog", blogSchema);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post("/blogs", async (req, res) => {
    try {
        const { title, body, author } = req.body;
        if (!title || !body) return res.status(400).json({ error: "Title and body are required" });

        const blog = new Blog({ title, body, author });
        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Blog not found" });

        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/blogs/:id", async (req, res) => {
    try {
        const { title, body, author } = req.body;
        const blog = await Blog.findByIdAndUpdate(req.params.id, { title, body, author }, { new: true });

        if (!blog) return res.status(404).json({ error: "Blog not found" });

        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) return res.status(404).json({ error: "Blog not found" });

        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () =>
    console.log('Server running on http://localhost:3000')
);
