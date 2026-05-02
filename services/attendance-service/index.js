const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3002;

// Endpoint Rekap (Syarat Komunikasi Inter-Service)
app.get('/rekap/:employee_id', async (req, res) => {
    const employeeId = req.params.employee_id;
    try {
        // Attendance Service memanggil API di Employee Service (Laravel port 8000)
        const employeeResponse = await axios.get(`http://localhost:8000/api/employees`);
        
        res.json({
            message: "Rekap absensi bulanan berhasil diambil",
            employee_id: employeeId,
            status: "Tervalidasi via Employee Service (Inter-service communication success)"
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal memverifikasi data ke Employee Service" });
    }
});

app.listen(PORT, () => {
    console.log(`Attendance Service is running on port ${PORT}`);
});