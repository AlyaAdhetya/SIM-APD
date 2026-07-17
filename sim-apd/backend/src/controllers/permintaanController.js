const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/permintaan/list
const getListPermintaan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s1.nama as nama_pengaju, s2.nama as nama_pemroses
      FROM permintaan_apd p
      JOIN staff s1 ON p.diajukan_oleh = s1.id
      LEFT JOIN staff s2 ON p.diproses_oleh = s2.id
      ORDER BY p.tgl_pengajuan DESC
    `);
    
    // Ambil detail untuk semua permintaan dan gabungkan
    const [details] = await db.query(`
      SELECT pd.*, a.nama_apd, s.ukuran 
      FROM permintaan_apd_detail pd
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
    `);

    const result = rows.map(r => {
      r.items = details.filter(d => d.permintaan_id === r.id);
      return r;
    });

    return jsonSuccess(res, result, 'Berhasil mengambil daftar permintaan.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/permintaan/create
const createPermintaan = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const staff_id = req.user.id;
    const { items, catatan } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items permintaan tidak boleh kosong.');
    }

    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const kode_permintaan = `REQ-${dateStr}`;

    const [insertResult] = await connection.query(
      'INSERT INTO permintaan_apd (kode_permintaan, diajukan_oleh, catatan) VALUES (?, ?, ?) RETURNING id',
      [kode_permintaan, staff_id, catatan || null]
    );
    const permintaanId = insertResult.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO permintaan_apd_detail (permintaan_id, apd_stok_id, jumlah_diminta) VALUES (?, ?, ?)',
        [permintaanId, item.apd_stok_id, item.jumlah_diminta]
      );
    }

    await connection.commit();
    return jsonSuccess(res, { id: permintaanId }, 'Permintaan berhasil diajukan.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// PUT /api/permintaan/approve/:id
const approvePermintaan = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.body;
    const staffId = req.user.id;

    await connection.beginTransaction();

    const [permintaan] = await connection.query('SELECT * FROM permintaan_apd WHERE id = ?', [id]);
    if (permintaan.length === 0) throw new Error('Data tidak ditemukan.');
    if (permintaan[0].status !== 'menunggu') throw new Error('Status tidak valid.');

    await connection.query(
      'UPDATE permintaan_apd SET status = ?, diproses_oleh = ?, waktu_diproses = NOW() WHERE id = ?',
      ['disetujui', staffId, id]
    );

    await connection.commit();
    return jsonSuccess(res, null, 'Permintaan disetujui.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// PUT /api/permintaan/reject/:id
const rejectPermintaan = async (req, res) => {
  try {
    const { id, alasan } = req.body;
    const staffId = req.user.id;

    await db.query(
      'UPDATE permintaan_apd SET status = ?, alasan_tolak = ?, diproses_oleh = ?, waktu_diproses = NOW() WHERE id = ?',
      ['ditolak', alasan || 'Ditolak', staffId, id]
    );
    return jsonSuccess(res, null, 'Permintaan ditolak.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getListPermintaan,
  createPermintaan,
  approvePermintaan,
  rejectPermintaan
};
