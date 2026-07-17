import { AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading,
  confirmText = 'Ya, Hapus',
  variant = 'danger' // 'danger' | 'primary'
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  let iconBg = '#fefce8';
  let iconColor = 'var(--primary-color)';
  let btnBg = 'var(--primary-color)';
  let btnHover = 'var(--primary-hover)';

  if (isDanger) {
    iconBg = 'var(--red-100)';
    iconColor = 'var(--red-600)';
    btnBg = 'var(--red-600)';
    btnHover = '#b91c1c';
  } else if (isSuccess) {
    iconBg = '#dcfce7';
    iconColor = '#16a34a';
    btnBg = '#16a34a';
    btnHover = '#15803d';
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{
        background: 'white',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        padding: 32,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>
        <button 
          onClick={onCancel}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', color: 'var(--slate-400)',
            cursor: 'pointer', padding: 4, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--slate-100)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--slate-400)'; }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20
        }}>
          {isDanger ? <AlertTriangle size={28} /> : <Info size={28} />}
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 32 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: 'white', border: '1px solid var(--border-color)',
              color: 'var(--text-main)', fontSize: 14, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = 'var(--slate-50)')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = 'white')}
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: btnBg, border: 'none',
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: '0.2s', opacity: isLoading ? 0.7 : 1
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = btnHover)}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = btnBg)}
          >
            {isLoading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
