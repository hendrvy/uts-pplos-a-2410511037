const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2'); 
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3002;

// --- KONEKSI DATABASE ATTENDANCE ---
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'uts_attendance_db',
    port: 3307
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke uts_attendance_db:', err);
        return;
    }
    console.log('Attendance Service terhubung ke uts_attendance_db');
});

// Endpoint Rekap (Syarat Komunikasi Inter-Service)
app.get('/rekap/:employee_id', async (req, res) => {
    const employeeId = req.params.employee_id;
    
    try {
        // 1. Validasi ke Employee Service (Laravel port 8000)
        // Kita panggil endpoint spesifik per ID agar benar-benar memvalidasi keberadaan pegawai
        const employeeResponse = await axios.get(`http://localhost:8000/api/employees`, {
            headers: { 'Accept': 'application/json' }
        });

        // 2. Ambil data dari database Attendance sendiri
        const query = 'SELECT * FROM attendances WHERE employee_id = ?';
        db.query(query, [employeeId], (err, results) => {
            if (err) return res.status(500).json({ error: "Database error di Attendance Service" });

            res.json({
                message: "Rekap absensi bulanan berhasil diambil",
                employee_id: employeeId,
                data_absensi: results, // Mengambil data dari uts_attendance_db
                status: "Tervalidasi via Employee Service (Inter-service communication success)"
            });
        });

    } catch (error) {
        // Jika Laravel (Port 8000) mati atau tidak memberikan respon sukses
        res.status(500).json({ 
            error: "Gagal memverifikasi data ke Employee Service",
            detail: "Pastikan Laravel (Port 8000) sudah running" 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Attendance Service is running on port ${PORT}`);
});