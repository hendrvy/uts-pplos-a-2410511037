const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;

// Endpoint Login Biasa (Bisa dihubungkan ke DB nanti)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    // TODO: Cek email & password di database

    // Generate Access Token (15 menit) & Refresh Token (7 hari)
    const accessToken = jwt.sign({ email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });

    res.json({ access_token: accessToken, refresh_token: refreshToken });
});

// Endpoint OAuth GitHub - Step 1: Redirect ke GitHub
app.get('/oauth/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/api/auth/oauth/github/callback'; // Lewat Gateway
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`);
});

// Endpoint OAuth GitHub - Step 2: Callback tangkap code
app.get('/oauth/github/callback', async (req, res) => {
    const code = req.query.code;
    try {
        // Tukar code dengan access token GitHub
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, { headers: { accept: 'application/json' } });

        const githubAccessToken = tokenResponse.data.access_token;

        // Ambil data user dari GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${githubAccessToken}` }
        });

        // TODO: Simpan userResponse.data (nama, email, avatar_url) ke Database dengan flag oauth_provider = 'github'

        // Generate JWT Lokal
        const accessToken = jwt.sign({ email: userResponse.data.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '15m' });
        res.json({ message: "OAuth Login Successful", github_data: userResponse.data, access_token: accessToken });

    } catch (error) {
        res.status(500).json({ error: "OAuth Authentication Failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});