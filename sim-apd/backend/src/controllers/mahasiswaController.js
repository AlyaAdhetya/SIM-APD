const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const xlsx = require('xlsx');

// GET /api/mahasiswa/list
const getListMahasiswa = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT m.id, m.nim, m.nama, m.universitas, m.divisi_id,
             d.nama_divisi AS divisi, m.wajib_apd,
             m.tgl_mulai, m.tgl_selesai, m.status, m.created_at
      FROM mahasiswa m
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
    `;
    const params = [];

    if (status && ['aktif', 'selesai'].includes(status)) {
      query += ' WHERE m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.created_at DESC';
    const [rows] = await db.query(query, params);
    return jsonSuccess(res, rows, 'Berhasil mengambil data mahasiswa.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// PUT /api/mahasiswa/update_status/:id
const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body; // 'aktif', 'selesai'

    if (!['aktif', 'selesai'].includes(status)) {
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
    const { nim, nama, universitas, divisi_id, wajib_apd, tgl_mulai, tgl_selesai } = req.body;

    if (!nim || !nama) {
      return jsonError(res, 'NIM dan Nama wajib diisi.', 400);
    }

    // Cek apakah NIM sudah dipakai akun lain
    const [existing] = await db.query('SELECT id FROM mahasiswa WHERE nim = ? AND id != ?', [nim, id]);
    if (existing.length > 0) return jsonError(res, 'NIM sudah terdaftar pada data lain.', 400);

    await db.query(
      'UPDATE mahasiswa SET nim = ?, nama = ?, universitas = ?, divisi_id = ?, wajib_apd = ?, tgl_mulai = ?, tgl_selesai = ? WHERE id = ?',
      [nim, nama, universitas || null, divisi_id || null, wajib_apd, tgl_mulai || null, tgl_selesai || null, id]
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

// DELETE /api/mahasiswa/delete_all
const deleteAllMahasiswa = async (req, res) => {
  try {
    await db.query('DELETE FROM mahasiswa');
    return jsonSuccess(res, null, 'Semua data mahasiswa berhasil dihapus.');
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

    // Cache semua divisi dari DB untuk performa
    const [allDivisi] = await db.query('SELECT id, nama_divisi, wajib_apd FROM divisi_apd');

    let importedCount = 0;
    
    // Process each row
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const nim = row[nimIdx];
      const nama = row[namaIdx];
      const universitas = univIdx !== -1 ? row[univIdx] : null;
      const divisiNama = divisiIdx !== -1 ? row[divisiIdx] : null;
      let tglMulai = tglMulaiIdx !== -1 ? row[tglMulaiIdx] : null;
      let tglSelesai = tglSelesaiIdx !== -1 ? row[tglSelesaiIdx] : null;

      if (!nim || !nama) continue; // Skip incomplete data

      // Check if NIM already exists
      const [existing] = await db.query('SELECT id FROM mahasiswa WHERE nim = ?', [nim]);
      if (existing.length > 0) continue; // Skip duplicate

      // Cari divisi_id berdasarkan nama_divisi
      let divisi_id = null;
      let wajib_apd = true;
      if (divisiNama) {
        const divRow = allDivisi.find(d => d.nama_divisi.toLowerCase() === String(divisiNama).toLowerCase().trim());
        if (divRow) {
          divisi_id = divRow.id;
          wajib_apd = divRow.wajib_apd;
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
        'INSERT INTO mahasiswa (nim, nama, universitas, divisi_id, wajib_apd, tgl_mulai, tgl_selesai, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nim, nama, universitas, divisi_id, wajib_apd, parseDate(tglMulai), parseDate(tglSelesai), 'aktif']
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
  deleteAllMahasiswa,
  importMahasiswa
};
