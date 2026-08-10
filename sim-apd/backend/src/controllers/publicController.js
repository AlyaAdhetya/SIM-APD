const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Buat transporter secara lazy di dalam fungsi agar env var terbaca saat request
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

// GET /api/public/check-nim/:nim
const checkNim = async (req, res) => {
  try {
    const { nim } = req.params;

    // Cari mahasiswa berdasarkan NIM (sekaligus JOIN ke divisi_apd via FK)
    const [mhsRows] = await db.query(`
      SELECT m.*, d.nama_divisi AS divisi, d.wajib_apd AS divisi_wajib_apd
      FROM mahasiswa m
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
      WHERE m.nim = ? LIMIT 1
    `, [nim]);
    const mhs = mhsRows[0];

    if (!mhs) {
      return jsonError(res, 'NIM tidak terdaftar di sistem.', 404);
    }

    // Ambil wajib_apd langsung dari JOIN
    let wajibApd = mhs.divisi_wajib_apd !== null ? (mhs.divisi_wajib_apd === true) : true;

    // Cek apakah mahasiswa sudah punya peminjaman aktif/selesai
    const [pjmRows] = await db.query('SELECT id, status FROM peminjaman WHERE mahasiswa_id = ? AND status != ?', [mhs.id, 'ditolak']);
    const hasPeminjaman = pjmRows.length > 0;

    return jsonSuccess(res, {
      mahasiswa: {
        id: mhs.id,
        nama: mhs.nama,
        nim: mhs.nim,
        email: mhs.email || '',
        universitas: mhs.universitas || '',
        tgl_mulai: mhs.tgl_mulai ? new Date(mhs.tgl_mulai).toISOString().split('T')[0] : '',
        tgl_selesai: mhs.tgl_selesai ? new Date(mhs.tgl_selesai).toISOString().split('T')[0] : '',
        divisi: mhs.divisi || '',
        divisi_id: mhs.divisi_id || null,
        wajib_apd: wajibApd,
        status: mhs.status,
        has_peminjaman: hasPeminjaman,
        peminjaman_status: hasPeminjaman ? pjmRows[0].status : null
      }
    }, 'Data mahasiswa ditemukan.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// GET /api/public/apd-stok
const getApdStok = async (req, res) => {
  try {
    // Ambil data APD beserta jenisnya yang tersedia
    const [rows] = await db.query(`
      SELECT 
        s.id as stok_id,
        s.ukuran,
        s.stok_tersedia as total_stok,
        j.nama_apd
      FROM apd_stok s
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE s.is_active = true AND s.stok_tersedia > 0
      ORDER BY j.nama_apd ASC, s.ukuran ASC
    `);

    return jsonSuccess(res, rows, 'Berhasil mengambil data stok APD.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// POST /api/public/submit-form
const submitForm = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { nim, email, universitas, tgl_mulai, tgl_selesai, apd_items } = req.body;

    if (!nim || !apd_items || apd_items.length === 0) {
      return jsonError(res, 'Data form tidak lengkap.', 400);
    }

    await connection.beginTransaction();

    // Verifikasi NIM lagi (sekaligus JOIN ke divisi_apd via FK)
    const [mhsRows] = await connection.query(`
      SELECT m.*, d.wajib_apd AS divisi_wajib_apd
      FROM mahasiswa m
      LEFT JOIN divisi_apd d ON m.divisi_id = d.id
      WHERE m.nim = ? LIMIT 1
    `, [nim]);
    const mhs = mhsRows[0];

    if (!mhs) {
      throw new Error('NIM tidak terdaftar.');
    }

    // Update data profil mahasiswa
    await connection.query(
      'UPDATE mahasiswa SET email = ?, universitas = ?, tgl_mulai = ?, tgl_selesai = ? WHERE id = ?',
      [email || null, universitas || null, tgl_mulai || null, tgl_selesai || null, mhs.id]
    );

    if (mhs.status !== 'aktif') {
      throw new Error('Status Anda sudah tidak aktif atau magang telah selesai.');
    }

    // Ambil wajib_apd langsung dari JOIN
    const wajibApd = mhs.divisi_wajib_apd !== null ? (mhs.divisi_wajib_apd === true) : true;
    if (!wajibApd) {
      throw new Error('Divisi Anda tidak diwajibkan menggunakan APD.');
    }

    // Pastikan belum pernah meminjam
    const [pjmRows] = await connection.query('SELECT id FROM peminjaman WHERE mahasiswa_id = ? AND status != ?', [mhs.id, 'ditolak']);
    if (pjmRows.length > 0) {
      throw new Error('Anda sudah pernah mengajukan form peminjaman sebelumnya.');
    }

    // Generate kode referensi pendek: PJM-[4 digit terakhir NIM]-[3 karakter acak]
    // Contoh: PJM-4521-K7B
    const nimSuffix = String(mhs.nim).slice(-4).padStart(4, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa huruf/angka ambigu (O,0,I,1)
    const randomPart = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const kodeReferensi = `PJM-${nimSuffix}-${randomPart}`;

    // Insert peminjaman header as 'menunggu_verifikasi' (Belum Diambil)
    const [insertPjm] = await connection.query(
      'INSERT INTO peminjaman (mahasiswa_id, kode_referensi, status) VALUES (?, ?, ?) RETURNING id',
      [mhs.id, kodeReferensi, 'menunggu_verifikasi']
    );

    // PostgreSQL RETURNING id is in insertPjm[0].id
    // MySQL insertId is in insertPjm.insertId
    const pjmId = (insertPjm[0] && insertPjm[0].id) || insertPjm.insertId;

    if (!pjmId) {
      throw new Error('Gagal menyimpan data peminjaman.');
    }

    // Insert detail
    for (const item of apd_items) {
      const { stok_id, jumlah } = item;

      // Verify stock exists and enough
      const [stokRows] = await connection.query('SELECT stok_tersedia FROM apd_stok WHERE id = ?', [stok_id]);
      if (stokRows.length === 0 || stokRows[0].stok_tersedia < (jumlah || 1)) {
        throw new Error('Stok untuk salah satu APD tidak mencukupi.');
      }

      await connection.query(
        'INSERT INTO peminjaman_detail (peminjaman_id, apd_stok_id) VALUES (?, ?)',
        [pjmId, stok_id]
      );
    }

    await connection.commit();

    // Ambil detail APD yang dipinjam untuk email
    const [apdDetailRows] = await db.query(`
      SELECT j.nama_apd, s.ukuran
      FROM peminjaman_detail pd
      JOIN apd_stok s ON pd.apd_stok_id = s.id
      JOIN apd_jenis j ON s.apd_jenis_id = j.id
      WHERE pd.peminjaman_id = ?
      ORDER BY j.nama_apd ASC
    `, [pjmId]);

    // Kirim Email Pemberitahuan
    try {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASS) {
        // Buat baris tabel HTML untuk setiap APD
        const apdTableRows = apdDetailRows.map((apd, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${apd.nama_apd}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${apd.ukuran}</td>
          </tr>
        `).join('');

        const mailOptions = {
          from: `"SIM APD RU III" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: `[${kodeReferensi}] Bukti Pengajuan Peminjaman APD`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
              
              <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0 0 4px;">✅ Pengajuan APD Berhasil</h2>
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">Sistem Informasi Manajemen APD - PT Pertamina RU III</p>
              </div>

              <div style="padding: 24px;">
                <p style="margin: 0 0 16px;">Halo <strong>${mhs.nama}</strong>,</p>
                <p style="margin: 0 0 20px; color: #475569;">Pengajuan peminjaman APD Anda telah berhasil direkam. Berikut adalah ringkasan pengajuan Anda:</p>

                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0 0 4px; color: #3b82f6; font-size: 13px; letter-spacing: 1px; font-weight: 600;">KODE REFERENSI</p>
                  <p style="margin: 0; color: #1d4ed8; font-size: 28px; font-weight: 800; letter-spacing: 2px;">${kodeReferensi}</p>
                </div>

                <p style="margin: 0 0 12px; font-weight: 600; color: #1e293b;">Daftar APD yang Dipinjam:</p>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-size: 14px;">
                  <thead>
                    <tr style="background-color: #1e293b;">
                      <th style="padding: 10px 14px; text-align: left; color: #ffffff; font-weight: 600; width: 40px;">No</th>
                      <th style="padding: 10px 14px; text-align: left; color: #ffffff; font-weight: 600;">Jenis APD</th>
                      <th style="padding: 10px 14px; text-align: left; color: #ffffff; font-weight: 600;">Ukuran</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${apdTableRows}
                  </tbody>
                </table>

                <div style="margin-top: 24px; padding: 14px 16px; background-color: #fefce8; border: 1px solid #fde047; border-radius: 6px; font-size: 14px; color: #713f12;">
                  ⚠️ Silakan tunjukkan <strong>kode referensi</strong> di atas kepada staff HC untuk proses pengambilan APD Anda.
                </div>
              </div>

              <div style="padding: 16px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                Email ini dikirim secara otomatis oleh Sistem Informasi Manajemen APD - PT Pertamina RU III.<br>Harap tidak membalas email ini.
              </div>
            </div>
          `
        };
        await createTransporter().sendMail(mailOptions);
        console.log(`Email bukti peminjaman berhasil dikirim ke ${email}`);
      } else {
        console.warn('Konfigurasi SMTP_EMAIL atau SMTP_PASS belum diatur di env. Email bukti peminjaman tidak dikirim.');
      }
    } catch (mailError) {
      console.error('Gagal mengirim email bukti peminjaman:', mailError);
    }

    return jsonSuccess(res, { kode_referensi: kodeReferensi }, 'Form peminjaman berhasil disubmit.');
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return jsonError(res, error.message || 'Terjadi kesalahan pada server.', 500);
  } finally {
    if (connection && connection.release) {
      connection.release();
    }
  }
};

const testSmtp = async (req, res) => {
  try {
    const toEmail = req.query.to || process.env.SMTP_EMAIL;
    if (!toEmail) {
      return jsonError(res, 'Missing to email in query parameters and SMTP_EMAIL in env.', 400);
    }
    const mailOptions = {
      from: `"SIM APD Test" <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: 'SIM APD SMTP Diagnostic Test',
      text: 'If you receive this, SMTP is working perfectly on Vercel!'
    };
    await transporter.sendMail(mailOptions);
    return jsonSuccess(res, null, `Test email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('SMTP Diagnostic Error:', error);
    return jsonError(res, {
      message: error.message,
      code: error.code,
      stack: error.stack
    }, 'SMTP Diagnostic Failed', 500);
  }
};

module.exports = {
  checkNim,
  getApdStok,
  submitForm,
  testSmtp
};
