const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const crypto = require('crypto');
const supabase = require('../config/supabaseClient');

// GET /api/peminjaman/list
const getListPeminjaman = async (req, res) => {
  try {
    let query = `
      SELECT p.*, m.nama as nama_mahasiswa, m.nim, s.nama as nama_staff 
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN staff s ON p.disetujui_oleh = s.id
    `;
    let params = [];
    let conditions = [];

    // Jika yang login mahasiswa, hanya tampilkan miliknya
    if (req.user.role === 'mahasiswa') {
      conditions.push('p.mahasiswa_id = ?');
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push('p.status = ?');
      params.push(req.query.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY p.tgl_pengajuan DESC`;

    const [rows] = await db.query(query, params);
    return jsonSuccess(res, rows, 'Berhasil mengambil daftar peminjaman.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/peminjaman/detail/:id
const getDetailPeminjaman = async (req, res) => {
  try {
    const { id } = req.query;
    const [peminjaman] = await db.query(`
      SELECT p.*, m.nama as nama_mahasiswa, m.nim, m.divisi 
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      WHERE p.id = ?
    `, [id]);

    if (peminjaman.length === 0) {
      return jsonError(res, 'Peminjaman tidak ditemukan.', 404);
    }

    const [details] = await db.query(`
      SELECT pd.*, a.nama_apd, s.ukuran 
      FROM peminjaman_detail pd
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
      WHERE pd.peminjaman_id = ?
    `, [id]);

    const responseData = {
      ...peminjaman[0],
      items: details.map(d => ({
        ...d,
        foto_url: d.foto_path
      }))
    };

    return jsonSuccess(res, responseData, 'Berhasil mengambil detail peminjaman.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/peminjaman/create
const createPeminjaman = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const mahasiswa_id = req.user.id;
    const { tgl_rencana_kembali, items } = req.body; // items is JSON string: [{apd_stok_id: 1}]
    
    if (!items) {
      throw new Error('Items APD tidak boleh kosong.');
    }

    const parsedItems = JSON.parse(items);
    
    // Generate kode referensi
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const kode_referensi = `PJM-${mahasiswa_id}-${dateStr}`;

    const [insertResult] = await connection.query(
      'INSERT INTO peminjaman (kode_referensi, mahasiswa_id, tgl_rencana_kembali) VALUES (?, ?, ?) RETURNING id',
      [kode_referensi, mahasiswa_id, tgl_rencana_kembali || null]
    );
    const peminjamanId = insertResult.insertId;

    // Process files and items
    // files fieldnames are usually something like "foto_0", "foto_1" or "fotos" array
    // Here we map them by index if they come as array or specific field
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      let fotoPath = null;
      
      // Look for a file for this item (assuming fieldname match or sequential)
      // Since it varies by frontend implementation, let's assume the frontend sends fieldname "foto_" + item.apd_stok_id
      if (req.files) {
        const file = req.files.find(f => f.fieldname === `foto_${item.apd_stok_id}` || f.fieldname === 'fotos');
        if (file) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = file.originalname.split('.').pop();
          const fileName = `peminjaman_${uniqueSuffix}.${ext}`;
          
          const { data, error } = await supabase.storage
            .from('peminjaman')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype
            });
            
          if (error) {
            throw new Error('Gagal mengupload foto APD: ' + error.message);
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('peminjaman')
            .getPublicUrl(fileName);
            
          fotoPath = publicUrlData.publicUrl;
        }
      }

      await connection.query(
        'INSERT INTO peminjaman_detail (peminjaman_id, apd_stok_id, foto_path) VALUES (?, ?, ?)',
        [peminjamanId, item.apd_stok_id, fotoPath]
      );
    }

    await connection.commit();
    return jsonSuccess(res, { id: peminjamanId }, 'Peminjaman berhasil diajukan.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan pada server.', 500);
  } finally {
    connection.release();
  }
};

// PUT /api/peminjaman/approve/:id
const approvePeminjaman = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.body;
    const staffId = req.user.id;

    await connection.beginTransaction();

    // Check existing
    const [peminjaman] = await connection.query('SELECT * FROM peminjaman WHERE id = ?', [id]);
    if (peminjaman.length === 0) throw new Error('Data tidak ditemukan.');
    if (peminjaman[0].status !== 'menunggu_verifikasi') throw new Error('Status peminjaman tidak valid untuk disetujui.');

    const qrToken = crypto.randomBytes(20).toString('hex');

    await connection.query(
      'UPDATE peminjaman SET status = ?, disetujui_oleh = ?, waktu_persetujuan = NOW(), qr_code_token = ? WHERE id = ?',
      ['disetujui', staffId, qrToken, id]
    );

    // Update stok (kurangi stok_tersedia, tambah stok_dipinjam)
    const [details] = await connection.query('SELECT apd_stok_id FROM peminjaman_detail WHERE peminjaman_id = ?', [id]);
    for (const d of details) {
      await connection.query(
        'UPDATE apd_stok SET stok_tersedia = stok_tersedia - 1, stok_dipinjam = stok_dipinjam + 1 WHERE id = ?',
        [d.apd_stok_id]
      );
    }

    await connection.commit();
    return jsonSuccess(res, null, 'Peminjaman disetujui.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// PUT /api/peminjaman/reject/:id
const rejectPeminjaman = async (req, res) => {
  try {
    const { id, alasan } = req.body;

    await db.query(
      'UPDATE peminjaman SET status = ?, alasan_tolak = ? WHERE id = ?',
      ['ditolak', alasan || 'Ditolak', id]
    );
    return jsonSuccess(res, null, 'Peminjaman ditolak.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// DELETE /api/peminjaman/delete/:id
const deletePeminjaman = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [peminjaman] = await connection.query('SELECT * FROM peminjaman WHERE id = ?', [id]);
    if (peminjaman.length === 0) throw new Error('Data tidak ditemukan.');

    if (req.user.role === 'mahasiswa') {
      if (peminjaman[0].mahasiswa_id !== req.user.id) {
        throw new Error('Anda tidak memiliki akses untuk menghapus data ini.');
      }
      if (peminjaman[0].status === 'disetujui') {
        throw new Error('Tidak dapat menghapus riwayat APD yang sedang dipinjam.');
      }
    }

    // Hapus data pengembalian terkait (jika ada) untuk menghindari foreign key constraint error
    const [pengembalianList] = await connection.query('SELECT id FROM pengembalian WHERE peminjaman_id = ?', [id]);
    if (pengembalianList.length > 0) {
      const pengembalianIds = pengembalianList.map(p => p.id);
      await connection.query('DELETE FROM pengembalian_detail WHERE pengembalian_id IN (?)', [pengembalianIds]);
      await connection.query('DELETE FROM pengembalian WHERE peminjaman_id = ?', [id]);
    }

    await connection.query('DELETE FROM peminjaman_detail WHERE peminjaman_id = ?', [id]);
    await connection.query('DELETE FROM peminjaman WHERE id = ?', [id]);

    await connection.commit();
    return jsonSuccess(res, null, 'Data peminjaman berhasil dihapus.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan pada server.', 500);
  } finally {
    connection.release();
  }
};

module.exports = {
  getListPeminjaman,
  getDetailPeminjaman,
  createPeminjaman,
  approvePeminjaman,
  rejectPeminjaman,
  deletePeminjaman
};
