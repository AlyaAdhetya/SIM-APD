const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/rusak_hilang/list
const getListRusakHilang = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT rh.*, pd.peminjaman_id, p.kode_referensi, p.mahasiswa_id, m.nama as nama_mahasiswa, a.nama_apd, s.ukuran
      FROM apd_rusak_hilang rh
      JOIN pengembalian_detail pgd ON rh.pengembalian_detail_id = pgd.id
      JOIN peminjaman_detail pd ON pgd.peminjaman_detail_id = pd.id
      JOIN peminjaman p ON pd.peminjaman_id = p.id
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
      ORDER BY rh.tgl_laporan DESC
    `);
    
    return jsonSuccess(res, rows, 'Berhasil mengambil data APD rusak/hilang.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// PUT /api/rusak_hilang/update_status/:id
const updateStatus = async (req, res) => {
  try {
    const { id, status_penanganan, catatan_hsse } = req.body;

    if (!['pending', 'proses', 'selesai'].includes(status_penanganan)) {
      return jsonError(res, 'Status penanganan tidak valid.', 400);
    }

    await db.query(
      'UPDATE apd_rusak_hilang SET status_penanganan = ?, catatan_hsse = ? WHERE id = ?',
      [status_penanganan, catatan_hsse || null, id]
    );

    return jsonSuccess(res, null, 'Status penanganan berhasil diperbarui.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getListRusakHilang,
  updateStatus
};
