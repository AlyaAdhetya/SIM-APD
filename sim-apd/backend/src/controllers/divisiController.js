const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/divisi/list
const getListDivisi = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM divisi_wajib_apd ORDER BY nama_divisi ASC');
    return jsonSuccess(res, rows, 'Berhasil mengambil data divisi.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/divisi/save
const saveDivisi = async (req, res) => {
  try {
    const { nama_divisi, wajib_apd } = req.body;
    if (!nama_divisi) {
      return jsonError(res, 'Nama divisi wajib diisi.', 400);
    }

    // Cek apakah sudah ada
    const [existing] = await db.query('SELECT * FROM divisi_wajib_apd WHERE nama_divisi = ?', [nama_divisi]);
    
    if (existing.length > 0) {
      // Update
      await db.query('UPDATE divisi_wajib_apd SET wajib_apd = ? WHERE id = ?', [wajib_apd ? 1 : 0, existing[0].id]);
      return jsonSuccess(res, null, 'Berhasil memperbarui divisi.');
    } else {
      // Insert
      const [result] = await db.query('INSERT INTO divisi_wajib_apd (nama_divisi, wajib_apd) VALUES (?, ?) RETURNING id', [nama_divisi, wajib_apd ? 1 : 0]);
      return jsonSuccess(res, { id: result.insertId }, 'Berhasil menambahkan divisi baru.');
    }
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getListDivisi,
  saveDivisi
};
