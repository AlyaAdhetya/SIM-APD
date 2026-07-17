import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { logout as apiLogout } from '../api/auth';
import { assetUrl } from '../api/client';
import { 
  LayoutDashboard, 
  History, 
  User,
  LogOut,
  Search,
  Bell,
  Settings,
  Menu
} from 'lucide-react';

const MENU = [
  { to: '/m', label: 'Beranda', icon: <LayoutDashboard size={20} strokeWidth={2} />, end: true },
  { to: '/m/riwayat', label: 'Riwayat Peminjaman', icon: <History size={20} strokeWidth={2} /> },
  { to: '/m/profil', label: 'Profil Saya', icon: <User size={20} strokeWidth={2} /> },
];

export default function MahasiswaDesktopLayout({ children, title, subtitle, hideNav }) {
  const { user, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  async function handleLogout() {
    try {
      await apiLogout();
    } catch (e) {}
    logoutLocal();
    navigate('/login');
  }

  return (
    <div className="app-shell-staff">
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand-text-container">
            <div className="brand-title">SIM-APD</div>
            <div className="brand-sub">Mahasiswa Magang</div>
          </div>
          <div style={{ padding: 4, display: 'flex', zIndex: 30 }}>
            <input type="checkbox" id="checkbox" checked={!sidebarOpen} onChange={() => setSidebarOpen(!sidebarOpen)} />
            <label htmlFor="checkbox" className="toggle">
                <div id="bar1" className="bars"></div>
                <div id="bar2" className="bars"></div>
                <div id="bar3" className="bars"></div>
            </label>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="menu-icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.foto_profil ? (
              <img src={assetUrl(user.foto_profil)} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar">
                {user?.nama?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{user?.nama || 'User'}</div>
              <div className="user-role">MAHASISWA</div>
            </div>
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={handleLogout} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', display: 'flex', justifyContent: 'center' }}>
            <LogOut size={16} />
            <span className="logout-text">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Overlay untuk mobile ketika sidebar terbuka */}
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>

      <main className={`staff-content ${sidebarOpen ? '' : 'expanded'}`}>
        <header className="staff-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger menu khusus mobile di topbar */}
            <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={20} strokeWidth={2.5} />
            </button>

            <div className="topbar-search-group">
              <Search className="topbar-search-icon" size={18} strokeWidth={2.5} />
              <input className="topbar-search-input" type="text" placeholder="Cari data..." />
            </div>
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} strokeWidth={2} />
            </button>
            <button className="icon-btn" onClick={() => navigate('/m/profil')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} strokeWidth={2} />
            </button>
            <div className="sidebar-user" style={{ marginBottom: 0, marginLeft: 8 }}>
              {user?.foto_profil ? (
                <img src={assetUrl(user.foto_profil)} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} />
              ) : (
                <div className="avatar" style={{ background: 'var(--primary-color)', color: '#0a192f', width: 36, height: 36, fontSize: 14 }}>
                  {user?.nama?.charAt(0).toUpperCase() || 'M'}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="content-body">
          {(title || subtitle) && (
            <div className="page-header">
              <h1 className="page-title">{title}</h1>
              {subtitle && <div className="page-subtitle">{subtitle}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
