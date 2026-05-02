const express = require('express');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 1. Basic Rate Limiting (60 req/menit per IP) - SYARAT UTS
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 menit
    max: 60,
    message: { message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// 2. Middleware Validasi JWT di Gateway - SYARAT UTS
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
// Endpoint Auth tidak perlu JWT karena user harus login dulu
app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

// Endpoint API Pegawai dan Absensi diproteksi JWT
app.use('/api/employees', verifyJWT, createProxyMiddleware({ target: 'http://localhost:8000', changeOrigin: true }));
app.use('/api/attendance', verifyJWT, createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));

app.listen(PORT, () => {
    console.log(`API Gateway is running on http://localhost:${PORT}`);
});// Note: Rate limiter configured 
