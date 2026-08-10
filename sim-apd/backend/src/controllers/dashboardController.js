const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/dashboard/hc_summary
const getHcSummary = async (req, res) => {
  try {
    const [mhsAktif] = await db.query("SELECT COUNT(*) as count FROM mahasiswa WHERE status = 'aktif'");
    const [pjmMenunggu] = await db.query("SELECT COUNT(*) as count FROM peminjaman WHERE status = 'menunggu_verifikasi'");
    
    // stok rendah
    const [stokRendah] = await db.query(`
      SELECT s.id as apd_stok_id, j.nama_apd, s.ukuran, s.stok_tersedia, s.batas_minimum
      FROM apd_stok s
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE s.stok_tersedia <= s.batas_minimum AND s.is_active = true
    `);

    // grafik_peminjam per divisi
    const [grafikPeminjam] = await db.query(`
      SELECT d.nama_divisi AS divisi, COUNT(p.id) as jumlah
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
      GROUP BY d.nama_divisi
    `);

    // kepatuhan pengembalian (deadline tracker)
    const [kepatuhan] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN m.tgl_selesai > CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as aman,
        COALESCE(SUM(CASE WHEN m.tgl_selesai > CURRENT_DATE AND m.tgl_selesai <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as warning,
        COALESCE(SUM(CASE WHEN m.tgl_selesai <= CURRENT_DATE THEN 1 ELSE 0 END), 0) as terlambat
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      WHERE p.status = 'disetujui'
    `);

    return jsonSuccess(res, {
      mahasiswa_aktif: mhsAktif[0].count,
      pending_peminjaman: pjmMenunggu[0].count,
      terlambat: kepatuhan[0].terlambat,
      grafik_peminjam: grafikPeminjam,
      kepatuhan: kepatuhan[0],
      stok_rendah: stokRendah
    }, 'Berhasil mengambil summary HC.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/dashboard/stok_apd
const getStokApd = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.nama_apd, s.ukuran, s.stok_tersedia, s.stok_dipinjam, s.stok_total, s.batas_minimum
      FROM apd_stok s
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE s.is_active = true
      ORDER BY j.nama_apd, s.ukuran
    `);
    return jsonSuccess(res, rows, 'Berhasil mengambil stok APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/dashboard/notifications
const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id as peminjaman_id, m.nama as nama_mahasiswa, m.tgl_selesai
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      WHERE p.status = 'disetujui' 
        AND m.tgl_selesai <= CURRENT_DATE 
        AND p.notif_terlambat_dibaca = false
      ORDER BY m.tgl_selesai ASC
    `);
    
    return jsonSuccess(res, rows, 'Berhasil mengambil notifikasi terlambat.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// PUT /api/dashboard/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE peminjaman 
      SET notif_terlambat_dibaca = true 
      WHERE id = ?
    `, [id]);
    
    return jsonSuccess(res, null, 'Notifikasi berhasil ditandai telah dibaca.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getHcSummary,
  getStokApd,
  getNotifications,
  markNotificationRead
};
