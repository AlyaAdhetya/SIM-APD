import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import EmptyState from '../../components/EmptyState';
import { LoadingPage } from '../../components/Loading';
import { listPeminjaman } from '../../api/peminjaman';
import { CheckCircle2 } from 'lucide-react';

export default function VerifikasiPeminjaman() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  function load() {
    listPeminjaman('menunggu_verifikasi')
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat daftar peminjaman.'));
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <StaffLayout title="Verifikasi Peminjaman" subtitle="Daftar pengajuan yang menunggu persetujuan">
      {error && <div className="alert alert-error">{error}</div>}
      {!list && !error && <LoadingPage />}
      {list && list.length === 0 && (
        <EmptyState icon={<CheckCircle2 size={40} strokeWidth={1.5} color="#16a34a" />} title="Tidak ada pengajuan yang menunggu verifikasi" />
      )}
      {list?.map((p) => (
        <div className="card" key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{p.nama_mahasiswa}</strong>
              <p style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 2 }}>
                NIM {p.nim} · {p.divisi} · {p.jumlah_item} item APD
              </p>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                Diajukan: {new Date(p.tgl_pengajuan).toLocaleString('id-ID')}
              </p>
            </div>
            <Link to={`/hc/verifikasi-peminjaman/${p.id}`} className="btn btn-primary btn-sm">
              Lihat &amp; Verifikasi
            </Link>
          </div>
        </div>
      ))}
    </StaffLayout>
  );
}
