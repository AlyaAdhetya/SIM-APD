const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/apd/list
const getListApd = async (req, res) => {
  try {
    const [jenis] = await db.query('SELECT * FROM apd_jenis WHERE is_active = true');
    const [stok] = await db.query('SELECT * FROM apd_stok WHERE is_active = true');

    // Group stok by apd_jenis_id
    const result = jenis.map((j) => {
      j.ukuran = stok
        .filter((s) => s.apd_jenis_id === j.id)
        .map((s) => ({
          ...s,
          apd_stok_id: s.id,
          stok_rendah: s.stok_tersedia <= s.batas_minimum
        }));
      return j;
    });

    return jsonSuccess(res, result, 'Berhasil mengambil daftar APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/apd/jenis_create
const createJenisApd = async (req, res) => {
  try {
    const { nama_apd, kategori, standar } = req.body;
    if (!nama_apd) {
      return jsonError(res, 'Nama APD wajib diisi.', 400);
    }

    const [result] = await db.query(
      'INSERT INTO apd_jenis (nama_apd, kategori, standar) VALUES (?, ?, ?) RETURNING id',
      [nama_apd, kategori || null, standar || null]
    );

    return jsonSuccess(res, { id: result.insertId }, 'Berhasil menambahkan jenis APD baru.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/apd/stok_create
const createStokApd = async (req, res) => {
  try {
    const { apd_jenis_id, ukuran, stok_total, batas_minimum } = req.body;
    if (!apd_jenis_id || !ukuran || stok_total === undefined) {
      return jsonError(res, 'ID Jenis, Ukuran, dan Stok Total wajib diisi.', 400);
    }

    const [result] = await db.query(
      'INSERT INTO apd_stok (apd_jenis_id, ukuran, stok_total, stok_tersedia, batas_minimum) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [apd_jenis_id, ukuran, stok_total, stok_total, batas_minimum || 5]
    );

    return jsonSuccess(res, { id: result.insertId }, 'Berhasil menambahkan stok APD.');
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return jsonError(res, 'Ukuran untuk jenis APD ini sudah ada.', 400);
    }
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/apd/stok_tambah — HC mencatat unit APD yang baru diterima dari HSSE
const tambahStokApd = async (req, res) => {
  try {
    const { id, stok_tambahan } = req.body;

    if (!id || !stok_tambahan || Number(stok_tambahan) <= 0) {
      return jsonError(res, 'ID dan jumlah unit yang diterima wajib diisi.', 400);
    }

    await db.query(
      'UPDATE apd_stok SET stok_total = stok_total + ?, stok_tersedia = stok_tersedia + ? WHERE id = ?',
      [stok_tambahan, stok_tambahan, id]
    );

    return jsonSuccess(res, null, 'Stok APD berhasil ditambahkan.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/apd/batas_minimum_update — Update threshold peringatan stok rendah
const updateBatasMinimum = async (req, res) => {
  try {
    const { id, batas_minimum } = req.body;

    if (!id || batas_minimum === undefined) {
      return jsonError(res, 'ID dan batas minimum wajib diisi.', 400);
    }

    await db.query(
      'UPDATE apd_stok SET batas_minimum = ? WHERE id = ?',
      [batas_minimum, id]
    );

    return jsonSuccess(res, null, 'Batas minimum berhasil diperbarui.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// Alias lama — backward compat (stok_tambahan atau batas_minimum)
const updateStokApd = async (req, res) => {
  const { stok_tambahan, batas_minimum } = req.body;
  if (stok_tambahan !== undefined) return tambahStokApd(req, res);
  if (batas_minimum !== undefined) return updateBatasMinimum(req, res);
  return jsonError(res, 'Tidak ada data yang dapat diperbarui.', 400);
};

// PUT /api/apd/nonaktifkan/:id
const nonaktifkanApd = async (req, res) => {
  try {
    const { id } = req.body;
    await db.query('UPDATE apd_jenis SET is_active = false WHERE id = ?', [id]);
    await db.query('UPDATE apd_stok SET is_active = false WHERE apd_jenis_id = ?', [id]);
    return jsonSuccess(res, null, 'Berhasil menonaktifkan APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getListApd,
  createJenisApd,
  createStokApd,
  tambahStokApd,
  updateBatasMinimum,
  updateStokApd,
  nonaktifkanApd
};
