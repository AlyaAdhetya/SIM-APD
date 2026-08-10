const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
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

    // Kirim Email Pemberitahuan
    try {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASS) {
        const mailOptions = {
          from: `"SIM APD RU III" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: 'Bukti Pengajuan Peminjaman APD',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #16a34a; text-align: center;">Pengajuan Berhasil</h2>
              <p>Halo <strong>${mhs.nama}</strong>,</p>
              <p>Terima kasih, form pengajuan peminjaman APD Anda telah berhasil direkam dalam sistem.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">KODE REFERENSI</p>
                <h3 style="margin: 8px 0 0; color: #0f172a; font-size: 24px;">${kodeReferensi}</h3>
              </div>
              <p>Silakan tunjukkan kode referensi ini kepada staff HC untuk proses pengambilan APD Anda.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">Email ini dikirim secara otomatis oleh Sistem Informasi Manajemen APD - PT Pertamina RU III.</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
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

module.exports = {
  checkNim,
  getApdStok,
  submitForm
};
