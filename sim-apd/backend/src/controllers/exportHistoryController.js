const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// Buat tabel jika belum ada (dijalankan saat server start)
const initExportHistoryTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS export_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      label VARCHAR(100) NOT NULL,
      periode_type VARCHAR(20) NOT NULL,
      periode_bulan INT,
      periode_tahun INT,
      total_data INT NOT NULL DEFAULT 0,
      data_snapshot JSONB NOT NULL,
      filename VARCHAR(255) NOT NULL,
      exported_at TIMESTAMPTZ DEFAULT NOW(),
      exported_by VARCHAR(100)
    )
  `);
};

// Inisialisasi tabel saat modul dimuat
initExportHistoryTable().catch(err =>
  console.error('[ExportHistory] Gagal membuat tabel:', err.message)
);

// POST /api/export-history/save
const saveExportHistory = async (req, res) => {
  try {
    const { label, periode_type, periode_bulan, periode_tahun, data_snapshot, filename } = req.body;

    if (!label || !periode_type || !data_snapshot || !filename) {
      return jsonError(res, 'Data tidak lengkap.', 400);
    }

    const exported_by = req.user?.nama || req.user?.username || 'HC Staff';
    const total_data = Array.isArray(data_snapshot) ? data_snapshot.length : 0;

    const [result] = await db.query(
      `INSERT INTO export_history 
        (label, periode_type, periode_bulan, periode_tahun, total_data, data_snapshot, filename, exported_by)
       VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?)
       RETURNING id`,
      [
        label,
        periode_type,
        periode_bulan || null,
        periode_tahun || null,
        total_data,
        JSON.stringify(data_snapshot),
        filename,
        exported_by
      ]
    );

    return jsonSuccess(res, { id: result[0]?.id }, 'Riwayat ekspor berhasil disimpan.');
  } catch (error) {
    console.error('[ExportHistory] saveExportHistory error:', error);
    return jsonError(res, 'Gagal menyimpan riwayat ekspor.', 500);
  }
};

// GET /api/export-history/list
const listExportHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, label, periode_type, periode_bulan, periode_tahun, total_data, filename, exported_at, exported_by
       FROM export_history
       ORDER BY exported_at DESC
       LIMIT 50`
    );
    return jsonSuccess(res, rows, 'Berhasil mengambil riwayat ekspor.');
  } catch (error) {
    console.error('[ExportHistory] listExportHistory error:', error);
    return jsonError(res, 'Gagal mengambil riwayat ekspor.', 500);
  }
};

// GET /api/export-history/:id/data
const getExportData = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT data_snapshot, filename, label FROM export_history WHERE id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return jsonError(res, 'Riwayat ekspor tidak ditemukan.', 404);
    }
    return jsonSuccess(res, {
      data_snapshot: rows[0].data_snapshot,
      filename: rows[0].filename,
      label: rows[0].label
    }, 'Berhasil mengambil data ekspor.');
  } catch (error) {
    console.error('[ExportHistory] getExportData error:', error);
    return jsonError(res, 'Gagal mengambil data ekspor.', 500);
  }
};

// DELETE /api/export-history/:id
const deleteExportHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM export_history WHERE id = ?', [id]);
    return jsonSuccess(res, null, 'Riwayat ekspor berhasil dihapus.');
  } catch (error) {
    console.error('[ExportHistory] deleteExportHistory error:', error);
    return jsonError(res, 'Gagal menghapus riwayat ekspor.', 500);
  }
};

module.exports = {
  saveExportHistory,
  listExportHistory,
  getExportData,
  deleteExportHistory
};
