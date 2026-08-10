require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const mahasiswaRoutes = require('./src/routes/mahasiswaRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const apdRoutes = require('./src/routes/apdRoutes');
const peminjamanRoutes = require('./src/routes/peminjamanRoutes');
const divisiRoutes = require('./src/routes/divisiRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const exportHistoryRoutes = require('./src/routes/exportHistoryRoutes');
const { initCron } = require('./src/cron/reminderCron');

app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/apd', apdRoutes);
app.use('/api/peminjaman', peminjamanRoutes);
app.use('/api/divisi', divisiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/export-history', exportHistoryRoutes);
// ...

app.get('/', (req, res) => {
  res.json({ message: 'SIM APD Backend is running (Node.js)' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran file foto terlalu besar (Maks 2MB).' });
  }
  if (err.message === 'Hanya file gambar yang diizinkan!') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

// Initialize Cron Jobs
initCron();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;

