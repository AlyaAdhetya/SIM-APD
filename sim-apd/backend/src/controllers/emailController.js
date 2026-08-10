const nodemailer = require('nodemailer');
const { jsonSuccess, jsonError } = require('../helpers/response');

// Konfigurasi Transporter Nodemailer
// service:'gmail' terbukti bekerja di Vercel
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'dummy@gmail.com',
    pass: process.env.SMTP_PASS || 'dummy'
  }
});

// POST /api/email/send-restock
const sendRestockEmail = async (req, res) => {
  try {
    const { to, items, catatan } = req.body;

    if (!to || !items || items.length === 0) {
      return jsonError(res, 'Email tujuan dan daftar APD tidak boleh kosong.', 400);
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
      return jsonError(res, 'Konfigurasi SMTP (SMTP_EMAIL & SMTP_PASS) belum diatur di .env', 500);
    }

    let itemsHtml = '<ul>';
    items.forEach(item => {
      itemsHtml += `<li><b>${item.nama}</b> (Ukuran: ${item.ukuran}): ${item.jumlah} buah</li>`;
    });
    itemsHtml += '</ul>';

    const mailOptions = {
      from: `"SIM APD - HC" <${process.env.SMTP_EMAIL}>`,
      to: to,
      subject: 'Permintaan Restock APD - PT Pertamina RU III',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Permintaan Restock APD</h2>
            <p style="margin: 5px 0 0 0; color: #94a3b8;">Sistem Informasi Manajemen APD</p>
          </div>
          
          <div style="padding: 24px;">
            <p>Halo Tim HSSE,</p>
            <p>Kami dari tim HC (Human Capital) ingin mengajukan permintaan restock APD dengan rincian sebagai berikut:</p>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 16px 0;">
              ${itemsHtml}
            </div>
            
            ${catatan ? `
            <div style="margin-top: 20px;">
              <strong>Catatan Tambahan:</strong><br>
              <p style="background-color: #fffbeb; padding: 12px; border-radius: 6px; border: 1px solid #fef3c7; color: #92400e;">
                ${catatan}
              </p>
            </div>
            ` : ''}
            
            <p style="margin-top: 32px;">Terima kasih,<br><strong>Tim HC</strong></p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
            Pesan ini dikirim secara otomatis oleh Sistem Manajemen APD PT Pertamina RU III.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return jsonSuccess(res, null, 'Email permintaan restock berhasil dikirim.');
  } catch (error) {
    console.error('Nodemailer Error Code:', error.code);
    console.error('Nodemailer Error Message:', error.message);
    console.error('Nodemailer Full Error:', error);
    const detail = error.code === 'EAUTH' 
      ? 'Kredensial Gmail salah. Pastikan App Password benar dan 2FA aktif di akun Google.'
      : error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT'
      ? 'Koneksi ke Gmail gagal. Periksa koneksi internet.'
      : `Error: ${error.message}`;
    return jsonError(res, detail, 500);
  }
};

module.exports = {
  sendRestockEmail
};
