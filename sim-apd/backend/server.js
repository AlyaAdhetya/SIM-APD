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
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/apd', require('./src/routes/apdRoutes'));
app.use('/api/divisi', require('./src/routes/divisiRoutes'));
app.use('/api/mahasiswa', require('./src/routes/mahasiswaRoutes'));
app.use('/api/peminjaman', require('./src/routes/peminjamanRoutes'));
app.use('/api/pengembalian', require('./src/routes/pengembalianRoutes'));
app.use('/api/permintaan', require('./src/routes/permintaanRoutes'));
app.use('/api/rusak_hilang', require('./src/routes/rusakHilangRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/report', require('./src/routes/reportRoutes'));
// ...

app.get('/', (req, res) => {
  res.json({ message: 'SIM APD Backend is running (Node.js)' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.', error: err.message, stack: err.stack });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;

