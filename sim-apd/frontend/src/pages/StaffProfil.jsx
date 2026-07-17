import { useState, useRef } from 'react';
import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateProfile } from '../api/auth';
import { apiErrorMessage, assetUrl } from '../api/client';
import { ButtonSpinner } from '../components/Loading';
import PasswordInput from '../components/PasswordInput';
import { Camera, Edit2 } from 'lucide-react';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}

export default function StaffProfil() {
  const { user, role, updateUser } = useAuth();
  
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
  const [username, setUsername] = useState(user?.username || '');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(user?.foto_profil 
    ? assetUrl(user.foto_profil)
    : null
  );
  const fileInputRef = useRef(null);

  const [profError, setProfError] = useState('');
  const [profSuccess, setProfSuccess] = useState('');
  const [profLoading, setProfLoading] = useState(false);

  // Fallback API URL, since frontend uses Vite proxy or full URL
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfError('Hanya file gambar yang diperbolehkan.');
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfError('');
    setProfSuccess('');
    
    if (!nama.trim() || !username.trim()) {
      setProfError('Nama dan Username tidak boleh kosong.');
      return;
    }

    setProfLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama', nama);
      formData.append('username', username);
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      const res = await updateProfile(formData);
      updateUser(res.data.user); // Update context and UI globally
      
      setProfSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
      setFotoFile(null); // Clear selected file for next time
    } catch (err) {
      setProfError(apiErrorMessage(err, 'Gagal memperbarui profil.'));
    } finally {
      setProfLoading(false);
    }
  }

  const userAvatar = fotoPreview || (user?.foto_profil ? assetUrl(user.foto_profil) : null);

  return (
    <StaffLayout title="Pengaturan Profil" subtitle="Informasi akun dan keamanan">
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
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '3px solid var(--gray-100)' }} />
                ) : (
                  <div className="avatar" style={{ background: 'var(--blue-600)', color: 'white', width: 80, height: 80, fontSize: 32, marginBottom: 12 }}>
                    {user?.nama?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-800)' }}>{user?.nama}</div>
                <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 2 }}>{role === 'hsse' ? 'Staff HSSE' : 'Staff HC'}</div>
              </div>
              
              <Row label="Nama Lengkap" value={user?.nama} />
              <Row label="Username" value={user?.username} />
              <Row label="Hak Akses (Role)" value={role?.toUpperCase()} />
            </>
          ) : (
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <label className="custum-file-upload" htmlFor="file">
                  <div className="icon">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile Preview" style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: 8 }} />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="" viewBox="0 0 24 24">
                        <g strokeWidth="0" id="SVGRepo_bgCarrier"></g>
                        <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier"></g>
                        <g id="SVGRepo_iconCarrier">
                          <path fill="" d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1182 22.7541 15.5866 21.0428 15.1438C20.8122 12.7844 18.8475 11 16.5 11ZM16.5 14C17.3284 14 18 14.6716 18 15.5V17H15V15.5C15 14.6716 15.6716 14 16.5 14Z"></path>
                        </g>
                      </svg>
                    )}
                  </div>
                  <div className="text">
                    <span>{userAvatar ? 'Ubah foto profil' : 'Klik untuk unggah foto profil'}</span>
                  </div>
                  <input type="file" id="file" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>

              <div className="field">
                <label>Nama Lengkap</label>
                <input className="input" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>
              <div className="field">
                <label>Username (Gunakan untuk Login)</label>
                <input className="input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => {
                  setIsEditing(false);
                  setNama(user?.nama || '');
                  setUsername(user?.username || '');
                  setFotoFile(null);
                  setFotoPreview(null);
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
    </StaffLayout>
  );
}
