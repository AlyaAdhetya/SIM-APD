require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    // Seed Staff
    await pool.query(
      `INSERT INTO staff (nama, username, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING`,
      ['Administrator', 'admin', hash, 'hc', 1]
    );

    // Seed Mahasiswa
    await pool.query(
      `INSERT INTO mahasiswa (nim, nama, universitas, divisi, wajib_apd, tgl_mulai, tgl_selesai, password, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (nim) DO NOTHING`,
      ['12345678', 'Mahasiswa Test', 'Universitas Test', 'IT', 1, new Date(), new Date(), hash, 'aktif']
    );

    console.log('Seed dummy users success! Username: admin, Password: admin123');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    pool.end();
  }
}

seed();
