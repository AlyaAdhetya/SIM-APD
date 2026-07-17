import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PackageSearch } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { LoadingPage } from '../../components/Loading';
import { listPermintaan } from '../../api/permintaan';
import { apiErrorMessage } from '../../api/client';

export default function RiwayatPermintaanHc() {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  function load() {
    listPermintaan()
      .then((res) => setList(res.data))
      .catch((err) => setError(apiErrorMessage(err, 'Gagal memuat riwayat permintaan.')));
  }

  useEffect(() => {
    load();
  }, []);

  if (!list && !error) return <StaffLayout title="Riwayat Permintaan"><LoadingPage /></StaffLayout>;

  return (
    <StaffLayout title="Riwayat Permintaan" subtitle="Daftar pengajuan restock APD ke HSSE">
      <div style={{ display: 'flex', marginBottom: 20 }}>
        <button 
          className="btn btn-outline" 
          onClick={() => navigate('/hc/permintaan-apd')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={18} /> Kembali ke Permintaan
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {list && list.length === 0 && (
        <EmptyState 
          icon={<PackageSearch size={48} style={{ color: 'var(--slate-300)' }} />} 
          title="Belum Ada Riwayat" 
          description="Anda belum pernah mengajukan permintaan restock APD." 
        />
      )}

      {list && list.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Kode & Tanggal</th>
                  <th style={{ width: '40%' }}>Detail Permintaan</th>
                  <th style={{ width: '20%' }}>Catatan</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: 4 }}>
                        {r.kode_permintaan}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        {new Date(r.tgl_pengajuan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.items.map((it, idx) => (
                          <div key={idx}>
                            • {it.nama_apd} (Ukuran: {it.ukuran}) — <strong>{it.jumlah_diminta} buah</strong>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      {r.catatan ? (
                        <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--slate-600)' }}>"{r.catatan}"</div>
                      ) : (
                        <span style={{ color: 'var(--slate-400)' }}>-</span>
                      )}
                      {r.status === 'ditolak' && r.alasan_tolak && (
                        <div style={{ fontSize: 13, color: 'var(--red-600)', marginTop: 8, fontWeight: 500 }}>
                          Alasan Tolak: {r.alasan_tolak}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
