const cron = require('node-cron');
const db = require('../config/database');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

function initCron() {
  // Jadwal berjalan setiap hari pada pukul 08:00 pagi
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Menjalankan pengecekan pengingat pengembalian APD...');

    try {
      if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
        console.log('[CRON] Kredensial SMTP belum diatur, tugas dibatalkan.');
        return;
      }

      // Cari peminjaman yang disetujui, belum dikembalikan sepenuhnya, dan tgl_selesai mahasiswa <= hari ini
      const [rows] = await db.query(`
        SELECT p.id as peminjaman_id, m.nama, m.email, m.tgl_selesai 
        FROM peminjaman p
        JOIN mahasiswa m ON p.mahasiswa_id = m.id
        WHERE p.status = 'disetujui' 
          AND m.tgl_selesai <= CURRENT_DATE
          AND m.email IS NOT NULL
      `);

      if (rows.length === 0) {
        console.log('[CRON] Tidak ada mahasiswa yang perlu diingatkan hari ini.');
        return;
      }

      for (const row of rows) {
        // Ambil detail item APD yang belum dikembalikan
        const [items] = await db.query(`
          SELECT a.nama_apd, s.ukuran
          FROM peminjaman_detail pd
          JOIN apd_stok s ON pd.apd_stok_id = s.id
          JOIN apd_jenis a ON s.apd_jenis_id = a.id
          WHERE pd.peminjaman_id = ? AND pd.sudah_dikembalikan = false
        `, [row.peminjaman_id]);

        if (items.length === 0) continue; // Sudah dikembalikan semua

        let itemsHtml = '<ul>';
        items.forEach(item => {
          itemsHtml += `<li><b>${item.nama_apd}</b> (Ukuran: ${item.ukuran})</li>`;
        });
        itemsHtml += '</ul>';

        const mailOptions = {
          from: `"SIM APD - PT Pertamina RU III" <${process.env.SMTP_EMAIL}>`,
          to: row.email,
          subject: 'Pemberitahuan Pengembalian APD',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #ea580c; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Pengingat Pengembalian APD</h2>
                <p style="margin: 5px 0 0 0; color: #ffedd5;">SIM-APD PT Pertamina RU III</p>
              </div>
              
              <div style="padding: 24px;">
                <p>Halo <b>${row.nama}</b>,</p>
                <p>Berdasarkan catatan sistem kami, masa magang/pekerjaan Anda berakhir pada tanggal <b>${new Date(row.tgl_selesai).toLocaleDateString('id-ID')}</b>.</p>
                <p>Mohon segera mengembalikan perlengkapan APD berikut ke tim HC:</p>
                
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #ea580c; margin: 16px 0;">
                  ${itemsHtml}
                </div>
                
                <p>Abaikan email ini jika Anda sudah mengembalikan semua barang di atas dan sedang menunggu konfirmasi staf.</p>
                
                <p style="margin-top: 32px;">Terima kasih,<br><strong>Tim HC PT Pertamina RU III</strong></p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
                Pesan ini dikirim secara otomatis oleh Sistem Manajemen APD PT Pertamina RU III.
              </div>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`[CRON] Berhasil mengirim email pengingat ke ${row.email} (${row.nama})`);
        } catch (emailErr) {
          console.error(`[CRON] Gagal mengirim email ke ${row.email}:`, emailErr);
        }
      }
    } catch (error) {
      console.error('[CRON] Kesalahan saat menjalankan tugas pengingat:', error);
    }
  });

  console.log('[CRON] Tugas pengingat pengembalian APD diinisialisasi (berjalan setiap pukul 08:00).');
}

module.exports = { initCron };
