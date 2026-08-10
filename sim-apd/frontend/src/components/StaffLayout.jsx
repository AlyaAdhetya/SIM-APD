import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { logout as apiLogout } from '../api/auth';
import { getNotifications, markNotificationRead } from '../api/notification';
import { assetUrl } from '../api/client';
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Box, 
  AlertTriangle,
  Clock,
  Bell,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  CheckCircle,
  X
} from 'lucide-react';

const HC_MENU = [
  { to: '/hc', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} />, end: true },
  { to: '/hc/peminjaman-pengembalian', label: 'Manajemen Form Mahasiswa', icon: <ClipboardList size={20} strokeWidth={2} /> },
  { to: '/hc/data-mahasiswa', label: 'Data Mahasiswa', icon: <GraduationCap size={20} strokeWidth={2} /> },
  { to: '/hc/kelola-apd', label: 'Kelola APD', icon: <ShieldCheck size={20} strokeWidth={2} /> },
  { to: '/hc/permintaan-apd', label: 'Permintaan Restock (Email)', icon: <Box size={20} strokeWidth={2} /> },
];

export default function StaffLayout({ children, title, subtitle }) {
  const { user, role, logoutLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menu = HC_MENU;

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [time, setTime] = useState(new Date());
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch notifications on mount
    loadNotifications();

    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }

  async function handleMarkRead(e, id) {
    e.stopPropagation();
    try {
      setRemovingId(id);
      await markNotificationRead(id);
      
      // Allow animation to finish before removing from state
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.peminjaman_id !== id));
        setRemovingId(null);
      }, 300); // 300ms matches CSS transition
    } catch (err) {
      console.error(err);
      setRemovingId(null);
    }
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } catch (e) {
      /* ignore */
    }
    logoutLocal();
    navigate('/staff/login');
  }

  const activeMenu = menu.find(m => location.pathname === m.to) || { label: title };
  const formattedTime = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="app-shell-staff">
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand-text-container">
            <div className="brand-title">SIM-APD</div>
            <div className="brand-sub">PT Pertamina RU III</div>
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
          {menu.map((item) => (
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
                {user?.nama?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{user?.nama || 'User'}</div>
              <div className="user-role">HC STAFF</div>
            </div>
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={handleLogout} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff', display: 'flex', justifyContent: 'center' }}>
            <LogOut size={16} />
            <span className="logout-text">Keluar</span>
          </button>
        </div>
      </aside>

      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>

      <main className={`staff-content ${sidebarOpen ? '' : 'expanded'}`}>
        <header className="staff-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={20} strokeWidth={2.5} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '-12px' }}>
              <Clock size={24} strokeWidth={2.5} style={{ color: 'var(--blue-600)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.1', letterSpacing: '0.5px' }}>
                  {formattedTime}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.2' }}>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="notif-wrapper" style={{ position: 'relative' }} ref={notifRef}>
              <button 
                className="icon-btn" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell size={20} strokeWidth={2} />
                {notifications.length > 0 && <div className="badge-dot"></div>}
              </button>

              {isNotifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h3>Notifikasi Terlambat ({notifications.length})</h3>
                    <button onClick={() => setIsNotifOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="notif-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <AlertTriangle size={32} style={{ color: 'var(--slate-300)', marginBottom: 8 }} />
                        <p>Tidak ada notifikasi keterlambatan saat ini.</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.peminjaman_id} className={`notif-item ${removingId === notif.peminjaman_id ? 'removing' : ''}`}>
                          <div className="notif-icon">
                            <AlertTriangle size={18} />
                          </div>
                          <div className="notif-content">
                            <p><b>{notif.nama_mahasiswa}</b> terlambat mengembalikan APD!</p>
                            <span>Tgl Selesai: {new Date(notif.tgl_selesai).toLocaleDateString('id-ID')}</span>
                          </div>
                          <button 
                            className="notif-action" 
                            title="Tandai sudah dibaca"
                            onClick={(e) => handleMarkRead(e, notif.peminjaman_id)}
                          >
                            <CheckCircle size={20} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="icon-btn" onClick={() => navigate('/staff/profil')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} strokeWidth={2} />
            </button>
            <div className="sidebar-user" style={{ marginBottom: 0, marginLeft: 8 }}>
              {user?.foto_profil ? (
                <img src={assetUrl(user.foto_profil)} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--blue-600)' }} />
              ) : (
                <div className="avatar" style={{ background: 'var(--blue-600)', color: 'white', width: 36, height: 36, fontSize: 14 }}>
                  {user?.nama?.charAt(0).toUpperCase() || 'U'}
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
