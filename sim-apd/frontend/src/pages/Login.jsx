import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { ButtonSpinner } from '../components/Loading';
import PasswordInput from '../components/PasswordInput';
import Toast from '../components/Toast';
import './Login.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toastType, setToastType] = useState('error');
  const [loading, setLoading] = useState(false);
  const { user, userType, role, login: authLogin } = useAuth();
  const navigate = useNavigate();

  // Jika sudah login, redirect
  if (user) {
    if (userType === 'staff') {
      if (role === 'hsse') return <Navigate to="/hsse" replace />;
      return <Navigate to="/hc" replace />;
    } else {
      return <Navigate to="/m" replace />;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setToastType('error');
      setError('Harap isi Username/NIM dan Password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(identifier, password);
      const payload = response.data; // Server wraps data inside 'data' property

      // Mahasiswa yang tidak wajib APD — tidak mendapat token
      if (payload.wajib_apd === false) {
        setToastType('warning');
        setError(`Halo ${payload.nama} (${payload.divisi}), akun Anda tidak memerlukan APD sehingga tidak dapat masuk ke sistem ini.`);
        setLoading(false);
        return;
      }

      authLogin({
        user: payload.user,
        token: payload.token,
        user_type: payload.user_type,
        role: payload.user.role || 'mahasiswa'
      });
      
      // Redirect berdasarkan role
      if (payload.user_type === 'staff') {
        if (payload.user.role === 'hsse') {
          navigate('/hsse', { replace: true });
        } else {
          navigate('/hc', { replace: true });
        }
      } else {
        navigate('/m', { replace: true });
      }
    } catch (err) {
      setToastType('error');
      setError(apiErrorMessage(err, 'Gagal masuk. Periksa kembali data Anda.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container-wrapper">
      <Toast message={error} type={toastType} onClose={() => setError('')} />

      <div className="login-card">
        <h1 className="login-heading">Masuk</h1>
        <div className="login-subheading">SIM-APD Pertamina RU III</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input 
            placeholder="Username atau NIM" 
            className="input" 
            type="text" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
          <PasswordInput 
            placeholder="Password" 
            className="input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="forgot-password"><a href="#">Lupa Password?</a></span>
          
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? <ButtonSpinner /> : 'Masuk ke Sistem'}
          </button>
        </form>

        <span className="agreement">Terkendala akses? Hubungi tim HC / HSSE.</span>
      </div>
    </div>
  );
}
