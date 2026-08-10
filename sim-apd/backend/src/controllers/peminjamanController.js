const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');

// GET /api/peminjaman/list
const getListPeminjaman = async (req, res) => {
  try {
    let query = `
      SELECT 
        p.*, 
        m.nama as nama_mahasiswa, m.nim, m.universitas, m.tgl_mulai, m.tgl_selesai, m.email, 
        d.nama_divisi AS divisi,
        s.nama as nama_staff,
        (SELECT STRING_AGG(CONCAT(a.nama_apd, ' (', s_sub.ukuran, ')'), ', ') 
         FROM peminjaman_detail pd1 
         JOIN apd_stok s_sub ON pd1.apd_stok_id = s_sub.id 
         JOIN apd_jenis a ON s_sub.apd_jenis_id = a.id 
         WHERE pd1.peminjaman_id = p.id) as daftar_apd,
        (SELECT COUNT(*) FROM peminjaman_detail pd2 WHERE pd2.peminjaman_id = p.id) as total_item
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
      LEFT JOIN staff s ON p.disetujui_oleh = s.id
    `;
    let params = [];
    let conditions = [];

    // Filter status
    if (req.query.status) {
      conditions.push('p.status = ?');
      params.push(req.query.status);
    }

    // Filter pencarian NIM atau nama mahasiswa
    if (req.query.search) {
      conditions.push('(m.nim ILIKE ? OR m.nama ILIKE ?)');
      const term = `%${req.query.search}%`;
      params.push(term, term);
    }

    // Filter per bulan (1-12)
    if (req.query.bulan) {
      conditions.push('EXTRACT(MONTH FROM p.tgl_pengajuan) = ?');
      params.push(parseInt(req.query.bulan));
    }

    // Filter per tahun
    if (req.query.tahun) {
      conditions.push('EXTRACT(YEAR FROM p.tgl_pengajuan) = ?');
      params.push(parseInt(req.query.tahun));
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY p.tgl_pengajuan DESC`;

    const [rows] = await db.query(query, params);
    return jsonSuccess(res, rows, 'Berhasil mengambil daftar peminjaman.');
  } catch (error) {
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan pada server.', 500);
  }
};


// GET /api/peminjaman/detail/:id
const getDetailPeminjaman = async (req, res) => {
  try {
    const { id } = req.query;
    const [peminjaman] = await db.query(`
      SELECT p.*, m.nama as nama_mahasiswa, m.nim, m.universitas, m.tgl_mulai, m.tgl_selesai, m.email,
             d.nama_divisi AS divisi 
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
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
      items: details
    };

    return jsonSuccess(res, responseData, 'Berhasil mengambil detail peminjaman.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
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

    await connection.query(
      'UPDATE peminjaman SET status = ?, disetujui_oleh = ?, waktu_persetujuan = NOW() WHERE id = ?',
      ['disetujui', staffId, id]
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

// PUT /api/peminjaman/finish/:id
const finishPeminjaman = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();

    const [peminjaman] = await connection.query('SELECT * FROM peminjaman WHERE id = ?', [id]);
    if (peminjaman.length === 0) throw new Error('Data tidak ditemukan.');
    if (peminjaman[0].status !== 'disetujui') throw new Error('Status peminjaman tidak valid (harus Aktif/Disetujui).');

    await connection.query(
      'UPDATE peminjaman SET status = ? WHERE id = ?',
      ['selesai', id]
    );

    // Kembalikan stok APD (stok_tersedia + 1, stok_dipinjam - 1) dan tandai sudah dikembalikan
    const [details] = await connection.query('SELECT id, apd_stok_id FROM peminjaman_detail WHERE peminjaman_id = ?', [id]);
    for (const d of details) {
      await connection.query(
        'UPDATE apd_stok SET stok_tersedia = stok_tersedia + 1, stok_dipinjam = GREATEST(stok_dipinjam - 1, 0) WHERE id = ?',
        [d.apd_stok_id]
      );
      await connection.query(
        'UPDATE peminjaman_detail SET sudah_dikembalikan = true WHERE id = ?',
        [d.id]
      );
    }

    await connection.commit();
    return jsonSuccess(res, null, 'Peminjaman ditandai sebagai selesai.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan.', 500);
  } finally {
    connection.release();
  }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

// POST /api/peminjaman/send-reminder/:id
const sendReminderPeminjaman = async (req, res) => {
  try {
    const { id } = req.params;

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
      return jsonError(res, 'Konfigurasi SMTP belum diatur pada server.', 500);
    }

    const [peminjaman] = await db.query(`
      SELECT p.*, m.nama as nama_mahasiswa, m.email, m.tgl_selesai 
      FROM peminjaman p
      JOIN mahasiswa m ON p.mahasiswa_id = m.id
      WHERE p.id = ?
    `, [id]);

    if (peminjaman.length === 0) return jsonError(res, 'Peminjaman tidak ditemukan.', 404);
    
    const pem = peminjaman[0];
    if (!pem.email) return jsonError(res, 'Mahasiswa bersangkutan belum mendaftarkan email.', 400);

    const [items] = await db.query(`
      SELECT a.nama_apd, s.ukuran
      FROM peminjaman_detail pd
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis a ON s.apd_jenis_id = a.id
      WHERE pd.peminjaman_id = ? AND pd.sudah_dikembalikan = false
    `, [id]);

    if (items.length === 0) return jsonError(res, 'Semua APD pada peminjaman ini sudah dikembalikan.', 400);

    let itemsHtml = '<ul>';
    items.forEach(item => {
      itemsHtml += `<li><b>${item.nama_apd}</b> (Ukuran: ${item.ukuran})</li>`;
    });
    itemsHtml += '</ul>';

    const tglSelesaiStr = pem.tgl_selesai ? new Date(pem.tgl_selesai).toLocaleDateString('id-ID') : '(Tidak Diketahui)';

    const mailOptions = {
      from: `"SIM APD - PT Pertamina RU III" <${process.env.SMTP_EMAIL}>`,
      to: pem.email,
      subject: 'Pemberitahuan Pengembalian APD (Manual)',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ea580c; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Pengingat Pengembalian APD</h2>
            <p style="margin: 5px 0 0 0; color: #ffedd5;">SIM-APD PT Pertamina RU III</p>
          </div>
          
          <div style="padding: 24px;">
            <p>Halo <b>${pem.nama_mahasiswa}</b>,</p>
            <p>Berdasarkan catatan sistem kami, masa magang/pekerjaan Anda akan atau telah berakhir pada tanggal <b>${tglSelesaiStr}</b>.</p>
            <p>Mohon segera mengembalikan perlengkapan APD berikut ke tim HC:</p>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #ea580c; margin: 16px 0;">
              ${itemsHtml}
            </div>
            
            <p>Abaikan email ini jika Anda sudah mengembalikan semua barang di atas dan sedang menunggu konfirmasi staf.</p>
            
            <p style="margin-top: 32px;">Terima kasih,<br><strong>Tim HC PT Pertamina RU III</strong></p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            Pesan ini dikirim oleh Sistem Manajemen APD PT Pertamina RU III.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return jsonSuccess(res, null, 'Email pengingat berhasil dikirim.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server saat mengirim email.', 500);
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
  approvePeminjaman,
  deletePeminjaman,
  finishPeminjaman,
  sendReminderPeminjaman
};
