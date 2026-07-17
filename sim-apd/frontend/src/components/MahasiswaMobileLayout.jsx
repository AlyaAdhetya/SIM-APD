import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as apiLogout } from '../api/auth';
import { assetUrl } from '../api/client';
import { 
  LayoutDashboard, 
  History, 
  User,
  LogOut,
  Bell
} from 'lucide-react';

const MENU = [
  { to: '/m', label: 'Beranda', icon: <LayoutDashboard size={20} strokeWidth={2.5} className="nav-icon" />, end: true },
  { to: '/m/riwayat', label: 'Riwayat', icon: <History size={20} strokeWidth={2.5} className="nav-icon" /> },
  { to: '/m/profil', label: 'Profil Saya', icon: <User size={20} strokeWidth={2.5} className="nav-icon" /> },
];

export default function MahasiswaMobileLayout({ children, title, subtitle, hideNav }) {
  const { user, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await apiLogout();
    } catch (e) {}
    logoutLocal();
    navigate('/login');
  }

  return (
    <div className="app-shell-mobile">
      <header className="mobile-topbar">
        <div className="topbar-row">
          <div>
            <h1>SIM-APD</h1>
            <div className="topbar-sub">PT Pertamina RU III</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="icon-btn" style={{ position: 'relative' }}>
              <Bell size={18} strokeWidth={2} />
              <div className="badge-dot" style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--red-500)', borderRadius: '50%' }}></div>
            </button>
            <button className="icon-btn" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="mobile-content">
        {(title || subtitle) && (
          <div className="page-header" style={{ marginBottom: 20 }}>
            <h1 className="page-title">{title}</h1>
            {subtitle && <div className="page-subtitle">{subtitle}</div>}
          </div>
        )}
        {children}
      </main>

      {!hideNav && (
        <nav className="mobile-bottomnav">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
