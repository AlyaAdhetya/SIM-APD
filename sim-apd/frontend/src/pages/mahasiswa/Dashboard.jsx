import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import { SkeletonCardList } from '../../components/Loading';
import StatusBadge from '../../components/StatusBadge';
import { listPeminjaman } from '../../api/peminjaman';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../api/client';
import { 
  HardHat, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Plus, 
  ArrowRight, 
  Eye,
  PackageOpen,
  ScanLine
} from 'lucide-react';
import './Mahasiswa.css';

export default function MahasiswaDashboard() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listPeminjaman()
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat data peminjaman.'));
  }, []);

  if (list === null && !error) return <MahasiswaLayout title="Beranda"><SkeletonCardList count={3} /></MahasiswaLayout>;

  const active = list?.find((p) => ['menunggu_verifikasi', 'disetujui'].includes(p.status));
  const firstName = user?.nama?.split(' ')[0] || '';

  return (
    <MahasiswaLayout title={`Selamat datang, ${firstName}`} subtitle={user?.divisi}>
      {error && <div className="alert alert-error">{error}</div>}

      {/* User Profile Header Card */}
      <div className="m-profile-header">
        <div className="m-profile-avatar">
          {user?.foto_profil ? (
            <img src={assetUrl(user.foto_profil)} alt="Foto" />
          ) : (
            <span>{firstName?.[0] || '?'}</span>
          )}
        </div>
        <div className="m-profile-info">
          <div className="m-profile-name">{user?.nama}</div>
          <div className="m-profile-detail">{user?.nim} · {user?.divisi}</div>
        </div>
      </div>

      {/* No active loan */}
      {!active && (
        <div className="m-card m-card-empty">
          <div className="m-card-icon-large">
            <HardHat size={48} strokeWidth={1.5} color="#94a3b8" />
          </div>
          <h3 className="m-card-title">Belum ada peminjaman aktif</h3>
          <p className="m-card-desc">
            Sebelum mengisi form ini, pastikan Anda sudah mencoba langsung ukuran APD
            bersama HC Staff di Ruangan Alat.
          </p>
          <Link to="/m/peminjaman" className="m-btn m-btn-gold">
            <Plus size={16} strokeWidth={2.5} />
            Ajukan Peminjaman APD
          </Link>
        </div>
      )}

      {/* Waiting for verification */}
      {active && active.status === 'menunggu_verifikasi' && (
        <div className="m-card m-card-pending">
          <div className="m-card-header">
            <div className="m-card-icon-circle m-icon-amber">
              <Clock size={22} strokeWidth={2} />
            </div>
            <div>
              <h3 className="m-card-title">Menunggu Verifikasi</h3>
              <span className="m-card-ref">{active.kode_referensi}</span>
            </div>
          </div>
          <div className="m-card-body">
            <StatusBadge status={active.status} />
            <p className="m-card-desc" style={{ marginTop: 12 }}>
              Pengajuan Anda sedang menunggu verifikasi dari HC Staff. 
              Tunggu sebentar di Ruangan Alat HC.
            </p>
          </div>
          <Link to={`/m/peminjaman/${active.id}`} className="m-btn m-btn-outline">
            <Eye size={16} strokeWidth={2} />
            Lihat Detail
          </Link>
        </div>
      )}

      {/* Approved loan */}
      {active && active.status === 'disetujui' && (
        <div className="m-grid">
          <div className="m-card m-card-approved">
            <div className="m-card-header">
              <div className="m-card-icon-circle m-icon-green">
                <CheckCircle2 size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 className="m-card-title">Peminjaman Disetujui</h3>
                <span className="m-card-ref">{active.kode_referensi}</span>
              </div>
            </div>
            <div className="m-card-body">
              <p className="m-card-desc">
                Anda sudah bisa membawa APD ini selama periode magang.
                Jika sudah selesai, klik tombol di bawah untuk mengajukan pengembalian.
              </p>
            </div>
            <Link to={`/m/pengembalian/${active.id}`} className="m-btn m-btn-gold">
              <PackageOpen size={16} strokeWidth={2} />
              Ajukan Pengembalian APD
            </Link>
          </div>

          <div className="m-card m-card-scan">
            <div className="m-card-header">
              <div className="m-card-icon-circle m-icon-blue">
                <ScanLine size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 className="m-card-title">Scan Pengembalian</h3>
              </div>
            </div>
            <div className="m-card-body">
              <p className="m-card-desc">
                Jika staf HC telah men-generate QR Code, buka scanner di bawah untuk men-scan layar mereka.
              </p>
            </div>
            <Link to="/m/scan-pengembalian" className="m-btn m-btn-navy">
              <QrCode size={16} strokeWidth={2} />
              Buka Scanner Kamera
            </Link>
          </div>

          <div className="m-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="m-card-title" style={{ fontSize: 14 }}>Detail Peminjaman</h3>
              <p className="m-card-desc" style={{ fontSize: 12 }}>Lihat rincian barang yang dipinjam</p>
            </div>
            <Link to={`/m/peminjaman/${active.id}`} className="m-btn m-btn-outline" style={{ width: 'auto', marginTop: 0 }}>
              <ArrowRight size={16} strokeWidth={2} />
              Lihat
            </Link>
          </div>
        </div>
      )}
    </MahasiswaLayout>
  );
}
