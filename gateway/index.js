const express = require('express');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 1. Basic Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 60,
    message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// 2. Middleware Validasi JWT
const verifyJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
        req.user = decoded;
        next();
    });
};

// 3. Routing ke Microservices (Proxy)

// Auth Service (Node.js) -> Tidak butuh pathRewrite
app.use('/api/auth', createProxyMiddleware({ 
    target: 'http://127.0.0.1:3001', 
    changeOrigin: true 
}));

// Employee Service (Laravel) -> WAJIB dipaksa pakai originalUrl agar rute & query param tidak hilang
app.use('/api/employees', verifyJWT, createProxyMiddleware({ 
    target: 'http://127.0.0.1:8000', 
    changeOrigin: true,
    pathRewrite: (path, req) => {
        return req.originalUrl; // Paksa kembalikan URL utuh (contoh: /api/employees)
    }
}));

// Attendance Service (Node.js) -> Tidak butuh pathRewrite
app.use('/api/attendance', verifyJWT, createProxyMiddleware({ 
    target: 'http://127.0.0.1:3002', 
    changeOrigin: true 
}));

app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
});

app.get('/api/auth/oauth/github', (req, res) => {
    // Teruskan ke Auth Service di port 3001
    res.redirect('http://localhost:3001/oauth/github');
});