const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const supabase = require('../config/supabaseClient');

// GET /api/pengembalian/list
const getListPengembalian = async (req, res) => {
  try {
    let query = `
      SELECT pg.*, p.kode_referensi, m.nama as nama_mahasiswa, s.nama as nama_staff
      FROM pengembalian pg
      JOIN peminjaman p ON pg.peminjaman_id = p.id
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN staff s ON pg.disetujui_oleh = s.id
    `;
    let params = [];
    let conditions = [];

    if (req.user.role === 'mahasiswa') {
      conditions.push('p.mahasiswa_id = ?');
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push('pg.status = ?');
      params.push(req.query.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY pg.tgl_pengajuan DESC`;

    const [rows] = await db.query(query, params);
    return jsonSuccess(res, rows, 'Berhasil mengambil daftar pengembalian.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/pengembalian/by_qr/:token
const getByQr = async (req, res) => {
  try {
    const { token } = req.query;
    const [peminjaman] = await db.query(`
      SELECT p.*, m.nama as nama_mahasiswa, m.nim 
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      WHERE p.qr_code_token = ? AND p.status = 'disetujui'
    `, [token]);

    if (peminjaman.length === 0) {
      return jsonError(res, 'QR Code tidak valid atau peminjaman belum disetujui.', 404);
    }

    const [details] = await db.query(`
      SELECT pd.*, a.nama_apd, s.ukuran 
      FROM peminjaman_detail pd
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
      WHERE pd.peminjaman_id = ? AND pd.sudah_dikembalikan = false
    `, [peminjaman[0].id]);

    const responseData = {
      peminjaman: {
        ...peminjaman[0],
        items: details
      }
    };

    return jsonSuccess(res, responseData, 'Data peminjaman ditemukan.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/pengembalian/create
const createPengembalian = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { peminjaman_id, items } = req.body;
    if (!items) throw new Error('Data items kosong.');
    const parsedItems = JSON.parse(items);

    const [insertResult] = await connection.query(
      'INSERT INTO pengembalian (peminjaman_id) VALUES (?) RETURNING id',
      [peminjaman_id]
    );
    const pengembalianId = insertResult.insertId;

    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i];
      let fotoPath = null;
      if (req.files) {
        const file = req.files.find(f => f.fieldname === `foto_${item.peminjaman_detail_id}` || f.fieldname === 'fotos');
        if (file) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = file.originalname.split('.').pop();
          const fileName = `pengembalian_${uniqueSuffix}.${ext}`;
          
          const { data, error } = await supabase.storage
            .from('pengembalian')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype
            });
            
          if (error) {
            throw new Error('Gagal mengupload foto pengembalian: ' + error.message);
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('pengembalian')
            .getPublicUrl(fileName);
            
          fotoPath = publicUrlData.publicUrl;
        }
      }

      await connection.query(
        'INSERT INTO pengembalian_detail (pengembalian_id, peminjaman_detail_id, kondisi, catatan, foto_path) VALUES (?, ?, ?, ?, ?)',
        [pengembalianId, item.peminjaman_detail_id, item.kondisi || 'baik', item.catatan || null, fotoPath]
      );
    }

    await connection.commit();
    return jsonSuccess(res, { id: pengembalianId }, 'Pengajuan pengembalian berhasil.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// PUT /api/pengembalian/approve/:id (HC generates QR)
const approvePengembalian = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.body;
    const staffId = req.user.id;

    await connection.beginTransaction();

    const [pengembalian] = await connection.query('SELECT * FROM pengembalian WHERE id = ?', [id]);
    if (pengembalian.length === 0) throw new Error('Data tidak ditemukan.');
    if (pengembalian[0].status !== 'menunggu_verifikasi') throw new Error('Status tidak valid.');

    // Generate unique token
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const token = `RET-${id}-${dateStr}`;

    await connection.query(
      'UPDATE pengembalian SET qr_code_token = ?, disetujui_oleh = ? WHERE id = ?',
      [token, staffId, id]
    );

    await connection.commit();
    return jsonSuccess(res, { token }, 'QR Code berhasil dibuat, silakan scan.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// POST /api/pengembalian/confirm-scan (Mahasiswa scans QR)
const confirmScanPengembalian = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { token } = req.body;
    const mahasiswaId = req.user.id;

    await connection.beginTransaction();

    const [pengembalian] = await connection.query(`
      SELECT pg.*, p.mahasiswa_id
      FROM pengembalian pg
      JOIN peminjaman p ON pg.peminjaman_id = p.id
      WHERE pg.qr_code_token = ? AND pg.status = 'menunggu_verifikasi'
    `, [token]);

    if (pengembalian.length === 0) throw new Error('QR Code tidak valid atau sudah kadaluarsa.');
    
    if (req.user.role === 'mahasiswa' && pengembalian[0].mahasiswa_id !== mahasiswaId) {
      throw new Error('Anda tidak memiliki akses ke pengembalian ini.');
    }

    const pgId = pengembalian[0].id;

    await connection.query(
      'UPDATE pengembalian SET status = ?, waktu_persetujuan = NOW() WHERE id = ?',
      ['disetujui', pgId]
    );

    const [details] = await connection.query('SELECT * FROM pengembalian_detail WHERE pengembalian_id = ?', [pgId]);
    
    for (const d of details) {
      await connection.query('UPDATE peminjaman_detail SET sudah_dikembalikan = true WHERE id = ?', [d.peminjaman_detail_id]);
      
      const [pDet] = await connection.query('SELECT apd_stok_id FROM peminjaman_detail WHERE id = ?', [d.peminjaman_detail_id]);
      const stokId = pDet[0].apd_stok_id;

      await connection.query('UPDATE apd_stok SET stok_dipinjam = stok_dipinjam - 1 WHERE id = ?', [stokId]);

      if (d.kondisi === 'baik') {
        await connection.query('UPDATE apd_stok SET stok_tersedia = stok_tersedia + 1 WHERE id = ?', [stokId]);
      } else {
        await connection.query('UPDATE apd_stok SET stok_total = stok_total - 1 WHERE id = ?', [stokId]);
        await connection.query(
          'INSERT INTO apd_rusak_hilang (pengembalian_detail_id, jenis_masalah) VALUES (?, ?)',
          [d.id, d.kondisi]
        );
      }
    }

    const [unreturned] = await connection.query(
      'SELECT id FROM peminjaman_detail WHERE peminjaman_id = ? AND sudah_dikembalikan = false',
      [pengembalian[0].peminjaman_id]
    );

    if (unreturned.length === 0) {
      await connection.query("UPDATE peminjaman SET status = 'selesai' WHERE id = ?", [pengembalian[0].peminjaman_id]);
    }

    await connection.commit();
    return jsonSuccess(res, null, 'Pengembalian berhasil diselesaikan.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

// DELETE /api/pengembalian/delete/:id
const deletePengembalian = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [pengembalian] = await connection.query('SELECT * FROM pengembalian WHERE id = ?', [id]);
    if (pengembalian.length === 0) throw new Error('Data tidak ditemukan.');

    // Jika terkait rusak hilang, hapus juga
    await connection.query('DELETE FROM apd_rusak_hilang WHERE pengembalian_detail_id IN (SELECT id FROM pengembalian_detail WHERE pengembalian_id = ?)', [id]);
    await connection.query('DELETE FROM pengembalian_detail WHERE pengembalian_id = ?', [id]);
    await connection.query('DELETE FROM pengembalian WHERE id = ?', [id]);

    await connection.commit();
    return jsonSuccess(res, null, 'Data pengembalian berhasil dihapus.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan pada server.', 500);
  } finally {
    connection.release();
  }
};

module.exports = {
  getListPengembalian,
  getByQr,
  createPengembalian,
  approvePengembalian,
  confirmScanPengembalian,
  deletePengembalian
};
