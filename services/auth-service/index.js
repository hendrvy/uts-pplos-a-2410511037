const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- KONEKSI DATABASE ---
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'uts_auth_db',
    port: 3307 
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke uts_auth_db:', err.message);
    } else {
        console.log('Auth Service terhubung ke uts_auth_db');
    }
});

// --- RUTE OAUTH REDIRECT (TES INI DULU) ---
app.get('/oauth/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = 'http://localhost:3000/api/auth/oauth/github/callback';
    
    // Log ini akan muncul di terminal kalau rute terpanggil
    console.log("Mencoba redirect ke GitHub dengan Client ID:", clientId);

    if (!clientId) {
        return res.status(500).send("Error: GITHUB_CLIENT_ID tidak ditemukan di .env");
    }

    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    res.redirect(githubUrl);
});

// --- RUTE CALLBACK ---
app.get('/oauth/github/callback', async (req, res) => {
    const { code } = req.query;
    console.log("Menerima code dari GitHub:", code);
    
    if (!code) return res.status(400).send("No code provided");

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, { headers: { accept: 'application/json' } });

        const githubToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${githubToken}` }
        });

        // Mapping ke database sesuai syarat UTS
        const { id, login, email, avatar_url } = userResponse.data;
        const userEmail = email || `${login}@github.com`;

        const query = 'SELECT * FROM users WHERE github_id = ?';
        db.query(query, [id], (err, results) => {
            if (results.length === 0) {
                const insert = 'INSERT INTO users (name, email, github_id, oauth_provider, profile_photo) VALUES (?, ?, ?, ?, ?)';
                db.query(insert, [login, userEmail, id, 'github', avatar_url]);
                console.log("User OAuth baru berhasil didaftarkan.");
            }
            
            const token = jwt.sign({ email: userEmail }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
            res.json({ access_token: token, user: userResponse.data });
        });
    } catch (error) {
        console.error("Error pada callback:", error.message);
        res.status(500).send("OAuth Gagal");
    }
});

// --- LISTENING HARUS DI PALING BAWAH ---
app.listen(PORT, () => {
    console.log(`Auth Service berjalan di port ${PORT}`);
});