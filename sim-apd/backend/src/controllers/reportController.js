const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/report/kepatuhan_apd
const getKepatuhanApd = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.divisi, 
        COUNT(m.id) as total_mahasiswa,
        SUM(m.wajib_apd::int) as total_wajib_apd,
        COUNT(p.id) as total_peminjaman,
        COUNT(p.id) / NULLIF(SUM(m.wajib_apd::int), 0) * 100 as persentase_kepatuhan
      FROM mahasiswa m
      LEFT JOIN peminjaman p ON m.id = p.mahasiswa_id AND p.status IN ('disetujui', 'selesai')
      WHERE m.wajib_apd = true
      GROUP BY m.divisi
    `);
    
    return jsonSuccess(res, rows, 'Berhasil mengambil laporan kepatuhan APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/report/penggunaan_apd
const getPenggunaanApd = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.nama_apd,
        a.kategori,
        COUNT(CASE WHEN pd.sudah_dikembalikan = false THEN 1 END) as total_sedang_dipinjam,
        COUNT(CASE WHEN pd.sudah_dikembalikan = true THEN 1 END) as total_selesai_dipinjam
      FROM peminjaman_detail pd
      JOIN peminjaman p ON pd.peminjaman_id = p.id
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
      WHERE p.status IN ('disetujui', 'selesai')
      GROUP BY a.id
    `);
    
    return jsonSuccess(res, rows, 'Berhasil mengambil laporan penggunaan APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/report/status_peminjaman
const getStatusPeminjaman = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        status, 
        COUNT(id) as total
      FROM peminjaman
      GROUP BY status
    `);
    
    return jsonSuccess(res, rows, 'Berhasil mengambil laporan status peminjaman.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getKepatuhanApd,
  getPenggunaanApd,
  getStatusPeminjaman
};
