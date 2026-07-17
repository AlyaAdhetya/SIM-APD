const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { jsonSuccess, jsonError } = require('../helpers/response');
const supabase = require('../config/supabaseClient');

const createToken = (user_type, role, id) => {
  return jwt.sign({ user_type, role, id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return jsonError(res, 'Username/NIM dan password wajib diisi.', 400);
    }

    const trimmedIdentifier = identifier.trim();

    // 1. Cek di tabel staff
    const [staffRows] = await db.query('SELECT * FROM staff WHERE username = ? LIMIT 1', [trimmedIdentifier]);
    const staff = staffRows[0];

    if (staff) {
      // User adalah staff
      if (!(await bcrypt.compare(password, staff.password))) {
        return jsonError(res, 'Password salah.', 401);
      }
      if (!staff.is_active) {
        return jsonError(res, 'Akun Anda tidak aktif. Silakan hubungi administrator.', 403);
      }
      
      const token = createToken('staff', staff.role, staff.id);
      delete staff.password; // Hilangkan password dari response
      return jsonSuccess(res, { token, user: staff, user_type: 'staff' }, 'Login berhasil.');
    }

    // 2. Jika bukan staff, cek di tabel mahasiswa
    const [mhsRows] = await db.query('SELECT * FROM mahasiswa WHERE nim = ? LIMIT 1', [trimmedIdentifier]);
    const mhs = mhsRows[0];

    if (mhs) {
      // User adalah mahasiswa
      if (!(await bcrypt.compare(password, mhs.password))) {
        return jsonError(res, 'Password salah.', 401);
      }
      if (mhs.status === 'nonaktif') {
        return jsonError(res, 'Akun Anda tidak aktif. Silakan hubungi HC Staff.', 403);
      }
      
      if (!mhs.wajib_apd) {
        return jsonSuccess(res, {
          wajib_apd: false,
          nama: mhs.nama,
          divisi: mhs.divisi,
          user_type: 'mahasiswa'
        }, 'Mahasiswa ini tidak wajib memakai APD.');
      }

      const token = createToken('mahasiswa', 'mahasiswa', mhs.id);
      delete mhs.password; // Hilangkan password dari response
      return jsonSuccess(res, { wajib_apd: true, token, user: mhs, user_type: 'mahasiswa' }, 'Login berhasil.');
    }

    // Jika tidak ditemukan di kedua tabel
    return jsonError(res, 'Username atau NIM tidak ditemukan.', 401);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.', error: error.message, stack: error.stack });
  }
};

const logout = (req, res) => {
  return jsonSuccess(res, null, 'Logout berhasil.');
};

const getMe = async (req, res) => {
  try {
    const { id, user_type } = req.user;
    if (user_type === 'staff') {
      const [rows] = await db.query('SELECT id, nama, username, role, is_active, foto_profil FROM staff WHERE id = ?', [id]);
      if (rows.length) {
        return jsonSuccess(res, { user: rows[0], user_type: 'staff', role: rows[0].role }, 'Berhasil mengambil data user');
      }
      return jsonError(res, 'User tidak ditemukan', 404);
    } else if (user_type === 'mahasiswa') {
      const [rows] = await db.query('SELECT * FROM mahasiswa WHERE id = ?', [id]);
      if (rows.length) {
        return jsonSuccess(res, { user: rows[0], user_type: 'mahasiswa', role: 'mahasiswa' }, 'Berhasil mengambil data user');
      }
      return jsonError(res, 'User tidak ditemukan', 404);
    }
    return jsonError(res, 'Sesi tidak valid, silakan login ulang.', 401);
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const { id, user_type } = req.user;

    if (!old_password || !new_password) {
      return jsonError(res, 'Password lama dan baru wajib diisi.', 400);
    }

    if (user_type === 'staff') {
      const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [id]);
      const staff = rows[0];

      if (!staff || !(await bcrypt.compare(old_password, staff.password))) {
        return jsonError(res, 'Password lama salah.', 401);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      await db.query('UPDATE staff SET password = ? WHERE id = ?', [hashedPassword, id]);
    } else if (user_type === 'mahasiswa') {
      const [rows] = await db.query('SELECT * FROM mahasiswa WHERE id = ?', [id]);
      const mhs = rows[0];

      if (!mhs || !(await bcrypt.compare(old_password, mhs.password))) {
        return jsonError(res, 'Password lama salah.', 401);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      await db.query('UPDATE mahasiswa SET password = ? WHERE id = ?', [hashedPassword, id]);
    } else {
      return jsonError(res, 'Tipe pengguna tidak valid.', 403);
    }

    return jsonSuccess(res, null, 'Password berhasil diubah.');
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server.', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id, user_type } = req.user;

    if (user_type === 'staff') {
      const { nama, username } = req.body;
      if (!nama || !username) {
        return jsonError(res, 'Nama dan username wajib diisi.', 400);
      }

      // Cek apakah username sudah dipakai orang lain
      const [existing] = await db.query('SELECT id FROM staff WHERE username = ? AND id != ?', [username.trim(), id]);
      if (existing.length > 0) {
        return jsonError(res, 'Username sudah digunakan oleh akun lain.', 400);
      }

      let fotoProfil = null;
      if (req.file) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = req.file.originalname.split('.').pop();
        const fileName = `profile_${uniqueSuffix}.${ext}`;
        
        const { data, error } = await supabase.storage
          .from('profile')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype
          });
          
        if (error) {
          return jsonError(res, 'Gagal mengupload foto profil: ' + error.message, 500);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('profile')
          .getPublicUrl(fileName);
          
        fotoProfil = publicUrlData.publicUrl;
      }

      if (fotoProfil) {
        await db.query('UPDATE staff SET nama = ?, username = ?, foto_profil = ? WHERE id = ?', [nama.trim(), username.trim(), fotoProfil, id]);
      } else {
        await db.query('UPDATE staff SET nama = ?, username = ? WHERE id = ?', [nama.trim(), username.trim(), id]);
      }

      // Ambil data terbaru untuk dikembalikan ke frontend
      const [rows] = await db.query('SELECT id, nama, username, role, is_active, foto_profil FROM staff WHERE id = ?', [id]);
      return jsonSuccess(res, { user: rows[0] }, 'Profil berhasil diperbarui.');
      
    } else if (user_type === 'mahasiswa') {
      const { nama, nim } = req.body;
      if (!nama || !nim) {
        return jsonError(res, 'Nama dan NIM wajib diisi.', 400);
      }

      // Cek apakah NIM sudah dipakai orang lain
      const [existing] = await db.query('SELECT id FROM mahasiswa WHERE nim = ? AND id != ?', [nim.trim(), id]);
      if (existing.length > 0) {
        return jsonError(res, 'NIM sudah terdaftar pada akun lain.', 400);
      }

      await db.query('UPDATE mahasiswa SET nama = ?, nim = ? WHERE id = ?', [nama.trim(), nim.trim(), id]);

      const [rows] = await db.query('SELECT id, nim, nama, universitas, divisi, wajib_apd, tgl_mulai, tgl_selesai, status, must_change_password FROM mahasiswa WHERE id = ?', [id]);
      
      // Kembalikan boolean untuk wajib_apd agar sesuai dengan frontend
      const user = rows[0];
      user.wajib_apd = user.wajib_apd === 1 || user.wajib_apd === true;
      user.must_change_password = user.must_change_password === 1 || user.must_change_password === true;

      return jsonSuccess(res, { user }, 'Profil berhasil diperbarui.');
    }

    return jsonError(res, 'Tipe pengguna tidak valid.', 400);
  } catch (error) {
    console.error(error);
    return jsonError(res, 'Terjadi kesalahan pada server saat memperbarui profil.', 500);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
  updateProfile
};
