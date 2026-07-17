import { useState } from 'react';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateProfile } from '../../api/auth';
import { apiErrorMessage, assetUrl } from '../../api/client';
import { ButtonSpinner } from '../../components/Loading';
import PasswordInput from '../../components/PasswordInput';
import { Edit2 } from 'lucide-react';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}

export default function Profil() {
  const { user, updateUser } = useAuth();
  
  // State for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // State for Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [nama, setNama] = useState(user?.nama || '');
  const [nim, setNim] = useState(user?.nim || '');

  const [profError, setProfError] = useState('');
  const [profSuccess, setProfSuccess] = useState('');
  const [profLoading, setProfLoading] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (!oldPassword) {
      setPassError('Password lama wajib diisi.');
      return;
    }
    
    if (password1.length < 6) {
      setPassError('Password baru minimal 6 karakter.');
      return;
    }
    if (password1 !== password2) {
      setPassError('Konfirmasi password tidak cocok.');
      return;
    }
    
    setPassLoading(true);
    try {
      await changePassword(oldPassword, password1);
      setPassSuccess('Password berhasil diubah!');
      setOldPassword('');
      setPassword1('');
      setPassword2('');
    } catch (err) {
      setPassError(apiErrorMessage(err, 'Gagal mengubah password.'));
    } finally {
      setPassLoading(false);
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfError('');
    setProfSuccess('');
    
    if (!nama.trim() || !nim.trim()) {
      setProfError('Nama dan NIM tidak boleh kosong.');
      return;
    }

    setProfLoading(true);
    try {
      const data = {
        nama: nama.trim(),
        nim: nim.trim()
      };

      // Since updateProfile uses multipart/form-data for staff, 
      // we can still send JSON or FormData depending on the API setup. 
      // Wait, api/auth.js sets 'Content-Type': 'multipart/form-data'.
      // So we must use FormData.
      const formData = new FormData();
      formData.append('nama', data.nama);
      formData.append('nim', data.nim);

      const res = await updateProfile(formData);
      updateUser(res.data.user); // Update context and UI globally
      
      setProfSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      setProfError(apiErrorMessage(err, 'Gagal memperbarui profil.'));
    } finally {
      setProfLoading(false);
    }
  }

  return (
    <MahasiswaLayout title="Pengaturan Profil" subtitle="Informasi akun dan keamanan">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Informasi Akun */}
        <div className="card" style={{ flex: '1 1 350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Informasi Akun</div>
            {!isEditing && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Edit2 size={14} /> Edit Profil
              </button>
            )}
          </div>

          {profError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{profError}</div>}
          {profSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{profSuccess}</div>}

          {!isEditing ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                {user?.foto_profil ? (
                  <img src={assetUrl(user.foto_profil)} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '3px solid var(--gray-100)' }} />
                ) : (
                  <div className="avatar" style={{ background: 'var(--primary-color)', color: '#0a192f', width: 80, height: 80, fontSize: 32, marginBottom: 12 }}>
                    {user?.nama?.charAt(0).toUpperCase() || 'M'}
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-800)' }}>{user?.nama}</div>
                <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 2 }}>MAHASISWA</div>
              </div>
              
              <Row label="Nama Lengkap" value={user?.nama} />
              <Row label="NIM" value={user?.nim} />
              <Row label="Universitas" value={user?.universitas} />
              <Row label="Divisi" value={user?.divisi} />
              <Row label="Periode Magang" value={`${user?.tgl_mulai ? new Date(user.tgl_mulai).toLocaleDateString('id-ID') : '-'} s/d ${user?.tgl_selesai ? new Date(user.tgl_selesai).toLocaleDateString('id-ID') : '-'}`} />
              <Row label="Wajib APD" value={user?.wajib_apd ? 'Ya' : 'Tidak'} />
            </>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div className="field">
                <label>Nama Lengkap</label>
                <input className="input" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
              <div className="field">
                <label>NIM (Gunakan untuk Login)</label>
                <input className="input" type="text" value={nim} onChange={(e) => setNim(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => {
                  setIsEditing(false);
                  setNama(user?.nama || '');
                  setNim(user?.nim || '');
                  setProfError('');
                }} style={{ flex: 1 }}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={profLoading} style={{ flex: 2 }}>
                  {profLoading ? <ButtonSpinner /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Keamanan / Ganti Password */}
        <div className="card" style={{ flex: '1 1 300px' }}>
          <div className="card-title">Ubah Password</div>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>
            Pastikan password Anda aman dan tidak mudah ditebak.
          </p>

          {passError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{passError}</div>}
          {passSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{passSuccess}</div>}

          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label>Password Lama</label>
              <PasswordInput 
                className="input" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
                placeholder="Masukkan password saat ini"
              />
            </div>
            <div className="field">
              <label>Password Baru</label>
              <PasswordInput 
                className="input" 
                value={password1} 
                onChange={(e) => setPassword1(e.target.value)} 
                required 
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="field">
              <label>Konfirmasi Password Baru</label>
              <PasswordInput 
                className="input" 
                value={password2} 
                onChange={(e) => setPassword2(e.target.value)} 
                required 
                placeholder="Ketik ulang password baru"
              />
            </div>
            <button className="btn btn-accent btn-block" disabled={passLoading} style={{ marginTop: 20 }}>
              {passLoading ? <ButtonSpinner /> : 'Simpan Password Baru'}
            </button>
          </form>
        </div>

      </div>
    </MahasiswaLayout>
  );
}
