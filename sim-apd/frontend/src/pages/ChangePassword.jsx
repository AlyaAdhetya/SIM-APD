import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ButtonSpinner } from '../components/Loading';
import PasswordInput from '../components/PasswordInput';
import { LockKeyhole } from 'lucide-react';

export default function ChangePassword() {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { userType, updateUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password1.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (password1 !== password2) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    setLoading(true);
    try {
      await changePassword('password123', password1);
      updateUser({ must_change_password: 0 });
      navigate(userType === 'mahasiswa' ? '/m' : '/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <div className="qr-card" style={{ maxWidth: 380, width: '100%', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}><LockKeyhole size={32} strokeWidth={1.5} color="#0f172a" /></div>
          <h1 style={{ fontSize: 19, color: 'var(--navy-900)' }}>Ganti Password</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
            Untuk keamanan, silakan ganti password awal Anda sebelum melanjutkan.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Password Baru</label>
            <PasswordInput className="input" value={password1} onChange={(e) => setPassword1(e.target.value)} required />
          </div>
          <div className="field">
            <label>Konfirmasi Password Baru</label>
            <PasswordInput className="input" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
          </div>
          <button className="btn btn-accent btn-block" disabled={loading}>
            {loading ? <ButtonSpinner /> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
