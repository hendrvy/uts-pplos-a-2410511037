const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3002; // Sesuai dengan routing di API Gateway

// Endpoint Clock-In (Contoh sederhana)
app.post('/clock-in', (req, res) => {
    const { employee_id } = req.body;
    // TODO: Simpan ke tabel attendances di database absensi
    res.status(201).json({ message: `Clock-in berhasil untuk pegawai ${employee_id}`, time: new Date() });
});

// Endpoint Rekap (KOMUNIKASI INTER-SERVICE)
app.get('/rekap/:employee_id', async (req, res) => {
    const employeeId = req.params.employee_id;

    try {
        // Attendance Service memanggil Employee Service (Laravel berjalan di port 8000)
        // Ini memenuhi syarat "Service MVC WAJIB di-konsumsi service lain"
        const employeeResponse = await axios.get(`http://localhost:8000/api/employees`);
        
        // Cek apakah pegawai ada di data Laravel (Data paginasi Laravel ada di .data.data)
        const employees = employeeResponse.data.data; 
        const isExist = employees.some(emp => emp.id == employeeId);

        if (!isExist) {
            return res.status(404).json({ message: "Pegawai tidak ditemukan di sistem kepegawaian utama." });
        }

        // Jika ada, kembalikan rekap data absensi
        res.json({
            message: "Rekap absensi bulanan berhasil diambil",
            employee_id: employeeId,
            total_kehadiran: 22, // Contoh data dummy
            status: "Tervalidasi via Employee Service"
        });

    } catch (error) {
        console.error("Gagal menghubungi Employee Service:", error.message);
        res.status(500).json({ error: "Gagal memverifikasi data pegawai ke Employee Service" });
    }
});

app.listen(PORT, () => {
    console.log(`Attendance Service is running on http://localhost:${PORT}`);
});