import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import StatusBadge from '../../components/StatusBadge';
import { LoadingPage } from '../../components/Loading';
import { detailPeminjaman } from '../../api/peminjaman';
import { assetUrl } from '../../api/client';
import { ImageOff } from 'lucide-react';

export default function DetailPeminjaman() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    detailPeminjaman(id)
      .then((res) => setData(res.data))
      .catch(() => setError('Gagal memuat detail peminjaman.'));
  }, [id]);

  if (!data && !error) return <MahasiswaLayout title="Detail Peminjaman" hideNav><LoadingPage /></MahasiswaLayout>;

  return (
    <MahasiswaLayout title="Detail Peminjaman" hideNav>
      {error && <div className="alert alert-error">{error}</div>}
      {data && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{data.kode_referensi}</strong>
              <StatusBadge status={data.status} />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>
              Diajukan: {new Date(data.tgl_pengajuan).toLocaleString('id-ID')}
            </p>
            {data.status === 'ditolak' && (
              <div className="alert alert-error" style={{ marginTop: 10 }}>
                Alasan ditolak: {data.alasan_tolak}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Daftar APD</div>
            <div className="photo-grid">
              {data.items.map((it) => (
                <div key={it.id}>
                  {it.foto_url ? (
                    <img src={assetUrl(it.foto_url)} alt={it.nama_apd} className="photo-thumb" />
                  ) : (
                    <div className="photo-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={24} color="#94a3b8" /></div>
                  )}
                  <p style={{ fontSize: 12.5, marginTop: 4, fontWeight: 600 }}>{it.nama_apd}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>Ukuran {it.ukuran}</p>
                </div>
              ))}
            </div>
          </div>

          <Link to="/m" className="btn btn-outline btn-block" style={{ marginTop: 14 }}>Kembali ke Beranda</Link>
        </>
      )}
    </MahasiswaLayout>
  );
}
