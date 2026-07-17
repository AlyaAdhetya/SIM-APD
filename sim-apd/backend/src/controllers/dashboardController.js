const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/dashboard/hc_summary
const getHcSummary = async (req, res) => {
  try {
    const [mhsAktif] = await db.query("SELECT COUNT(*) as count FROM mahasiswa WHERE status = 'aktif'");
    const [pjmMenunggu] = await db.query("SELECT COUNT(*) as count FROM peminjaman WHERE status = 'menunggu_verifikasi'");
    const [pgbMenunggu] = await db.query("SELECT COUNT(*) as count FROM pengembalian WHERE status = 'menunggu_verifikasi'");
    const [reqPending] = await db.query("SELECT COUNT(*) as count FROM permintaan_apd WHERE status = 'menunggu'");
    
    // stok rendah
    const [stokRendah] = await db.query(`
      SELECT s.id as apd_stok_id, j.nama_apd, s.ukuran, s.stok_tersedia, s.batas_minimum
      FROM apd_stok s
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE s.stok_tersedia <= s.batas_minimum AND s.is_active = true
    `);

    // grafik_peminjam per divisi
    const [grafikPeminjam] = await db.query(`
      SELECT m.divisi, COUNT(p.id) as jumlah
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      GROUP BY m.divisi
    `);

    return jsonSuccess(res, {
      mahasiswa_aktif: mhsAktif[0].count,
      pending_peminjaman: pjmMenunggu[0].count,
      pending_pengembalian: pgbMenunggu[0].count,
      permintaan_pending: reqPending[0].count,
      grafik_peminjam: grafikPeminjam,
      stok_rendah: stokRendah
    }, 'Berhasil mengambil summary HC.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/dashboard/hsse_summary
const getHsseSummary = async (req, res) => {
  try {
    const [reqMenunggu] = await db.query("SELECT COUNT(*) as count FROM permintaan_apd WHERE status = 'menunggu'");
    const [pendingRusakHilang] = await db.query("SELECT COUNT(*) as count FROM apd_rusak_hilang WHERE status_penanganan = 'pending'");
    const [totalRusak] = await db.query("SELECT COUNT(*) as count FROM apd_rusak_hilang WHERE jenis_masalah = 'rusak'");
    const [totalHilang] = await db.query("SELECT COUNT(*) as count FROM apd_rusak_hilang WHERE jenis_masalah = 'hilang'");

    const [stokRendah] = await db.query(`
      SELECT s.id as apd_stok_id, j.nama_apd, s.ukuran, s.stok_tersedia, s.batas_minimum
      FROM apd_stok s
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE s.stok_tersedia <= s.batas_minimum AND s.is_active = true
    `);

    const [inventorisTersedia] = await db.query("SELECT SUM(stok_tersedia) as sum FROM apd_stok WHERE is_active = true");
    const [inventorisPermintaan] = await db.query("SELECT SUM(jumlah_diminta) as sum FROM permintaan_apd_detail pi JOIN permintaan_apd p ON pi.permintaan_id = p.id WHERE p.status = 'menunggu'");

    return jsonSuccess(res, {
      total_rusak: totalRusak[0].count || 0,
      total_hilang: totalHilang[0].count || 0,
      pending_rusak_hilang: pendingRusakHilang[0].count || 0,
      permintaan_pending: reqMenunggu[0].count || 0,
      grafik_inventoris: {
        'Tersedia': inventorisTersedia[0].sum || 0,
        'Permintaan HC': inventorisPermintaan[0].sum || 0,
        'Rusak': totalRusak[0].count || 0,
        'Hilang': totalHilang[0].count || 0,
      },
      stok_rendah_hc: stokRendah
    }, 'Berhasil mengambil summary HSSE.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

module.exports = {
  getHcSummary,
  getHsseSummary
};
