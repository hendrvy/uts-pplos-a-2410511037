const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

// Endpoint Login Biasa
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Generate Access Token (15 menit) & Refresh Token (7 hari)
    const accessToken = jwt.sign({ email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });
    
    res.json({ access_token: accessToken, refresh_token: refreshToken });
});

// Endpoint OAuth GitHub - Redirect
app.get('/oauth/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || 'dummy_client_id';
    const redirectUri = 'http://localhost:3000/api/auth/oauth/github/callback';
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`);
});

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});