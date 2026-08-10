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

  if (user) {
    if (userType === 'staff') {
      if (role === 'hc') return <Navigate to="/hc" replace />;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setToastType('error');
      setError('Harap isi Username dan Password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(identifier, password);
      const payload = response.data; // Server wraps data inside 'data' property

      authLogin({
        user: payload.user,
        token: payload.token,
        user_type: payload.user_type,
        role: payload.user.role
      });
      
      navigate('/hc', { replace: true });
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
            placeholder="Username" 
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
          

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? <ButtonSpinner /> : 'Masuk ke Sistem'}
          </button>
        </form>

        <span className="agreement">Terkendala akses? Hubungi tim IT / HC.</span>
      </div>
    </div>
  );
}
