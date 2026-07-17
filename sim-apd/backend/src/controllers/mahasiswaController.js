const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

// GET /api/mahasiswa/list
const getListMahasiswa = async (req, res) => {
  try {
    // Otomatis set status 'selesai' untuk mahasiswa yang tgl_selesai-nya sudah lewat
    await db.query(`
      UPDATE mahasiswa 
      SET status = 'selesai' 
      WHERE tgl_selesai < CURRENT_DATE AND status = 'aktif'
    `);

    const [rows] = await db.query('SELECT id, nim, nama, universitas, divisi, wajib_apd, tgl_mulai, tgl_selesai, status, created_at FROM mahasiswa ORDER BY created_at DESC');
    return jsonSuccess(res, rows, 'Berhasil mengambil data mahasiswa.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// PUT /api/mahasiswa/update_status/:id
const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body; // 'aktif', 'selesai', 'nonaktif'

    if (!['aktif', 'selesai', 'nonaktif'].includes(status)) {
      return jsonError(res, 'Status tidak valid.', 400);
    }

    await db.query('UPDATE mahasiswa SET status = ? WHERE id = ?', [status, id]);
    return jsonSuccess(res, null, `Status mahasiswa berhasil diubah menjadi ${status}.`);
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// PUT /api/mahasiswa/update/:id
const updateMahasiswa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nim, nama, universitas, divisi, wajib_apd, tgl_mulai, tgl_selesai } = req.body;

    if (!nim || !nama) {
      return jsonError(res, 'NIM dan Nama wajib diisi.', 400);
    }

    // Cek apakah NIM sudah dipakai akun lain
    const [existing] = await db.query('SELECT id FROM mahasiswa WHERE nim = ? AND id != ?', [nim, id]);
    if (existing.length > 0) return jsonError(res, 'NIM sudah terdaftar pada data lain.', 400);

    await db.query(
      'UPDATE mahasiswa SET nim = ?, nama = ?, universitas = ?, divisi = ?, wajib_apd = ?, tgl_mulai = ?, tgl_selesai = ? WHERE id = ?',
      [nim, nama, universitas || null, divisi || null, wajib_apd, tgl_mulai || null, tgl_selesai || null, id]
    );

    return jsonSuccess(res, null, 'Data mahasiswa berhasil diperbarui.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// DELETE /api/mahasiswa/delete/:id
const deleteMahasiswa = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM mahasiswa WHERE id = ?', [id]);
    return jsonSuccess(res, null, 'Data mahasiswa berhasil dihapus.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/mahasiswa/import
const importMahasiswa = async (req, res) => {
  try {
    if (!req.file) {
      return jsonError(res, 'File Excel tidak ditemukan.', 400);
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Cari baris yang berisi header (NIM dan Nama)
    let headerRowIndex = -1;
    let headers = [];
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const strRow = row.map(cell => String(cell || '').toLowerCase().trim());
        if (strRow.includes('nim') && strRow.includes('nama')) {
          headerRowIndex = i;
          headers = strRow;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      return jsonError(res, 'Format Excel tidak valid. Tidak menemukan baris header (NIM dan Nama).', 400);
    }

    // Mapping index kolom
    const nimIdx = headers.findIndex(h => h === 'nim');
    const namaIdx = headers.findIndex(h => h === 'nama');
    const univIdx = headers.findIndex(h => h === 'universitas' || h === 'asal universitas');
    const divisiIdx = headers.findIndex(h => h === 'divisi' || h === 'tempat pkl');
    const tglMulaiIdx = headers.findIndex(h => h.includes('mulai'));
    const tglSelesaiIdx = headers.findIndex(h => h.includes('selesai') || h.includes('akhir'));

    let importedCount = 0;
    
    // Process each row
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const nim = row[nimIdx];
      const nama = row[namaIdx];
      const universitas = univIdx !== -1 ? row[univIdx] : null;
      const divisi = divisiIdx !== -1 ? row[divisiIdx] : null;
      let tglMulai = tglMulaiIdx !== -1 ? row[tglMulaiIdx] : null;
      let tglSelesai = tglSelesaiIdx !== -1 ? row[tglSelesaiIdx] : null;

      if (!nim || !nama) continue; // Skip incomplete data

      // Check if NIM already exists
      const [existing] = await db.query('SELECT id FROM mahasiswa WHERE nim = ?', [nim]);
      if (existing.length > 0) continue; // Skip duplicate

      // Hash password (default: nim)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(nim.toString(), salt);

      // Check wajib_apd from divisi
      let wajib_apd = true;
      if (divisi) {
        const [divRow] = await db.query('SELECT wajib_apd FROM divisi_wajib_apd WHERE nama_divisi = ?', [divisi]);
        if (divRow.length > 0) {
          wajib_apd = divRow[0].wajib_apd;
        }
      }

      // Convert excel dates (strings, numbers, or JS Date objects if cellDates: true)
      const parseDate = (d) => {
        if (!d) return null;
        if (d instanceof Date) {
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
        if (typeof d === 'number') {
           const date = new Date((d - (25567 + 2)) * 86400 * 1000);
           return date.toISOString().split('T')[0];
        }
        if (typeof d === 'string') {
           const parsed = new Date(d.replace(/-/g, '/'));
           if (!isNaN(parsed.getTime())) {
               return parsed.toISOString().split('T')[0];
           }
        }
        return d;
      }

      await db.query(
        'INSERT INTO mahasiswa (nim, nama, universitas, divisi, wajib_apd, tgl_mulai, tgl_selesai, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nim, nama, universitas, divisi, wajib_apd, parseDate(tglMulai), parseDate(tglSelesai), hashedPassword, 'aktif']
      );
      importedCount++;
    }

    return jsonSuccess(res, { imported: importedCount }, `Berhasil mengimpor ${importedCount} data mahasiswa.`);
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan saat mengimpor data.', 500);
  }
};

module.exports = {
  getListMahasiswa,
  updateStatus,
  updateMahasiswa,
  deleteMahasiswa,
  importMahasiswa
};
