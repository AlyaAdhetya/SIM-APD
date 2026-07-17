import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { detailPeminjaman, approvePeminjaman, rejectPeminjaman } from '../../api/peminjaman';
import { apiErrorMessage, assetUrl } from '../../api/client';
import { ImageOff, Check } from 'lucide-react';

export default function VerifikasiPeminjamanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [alasan, setAlasan] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  function load() {
    detailPeminjaman(id)
      .then((res) => setData(res.data))
      .catch(() => setError('Gagal memuat detail peminjaman.'));
  }
  useEffect(() => { load(); }, [id]);

  async function executeApprove() {
    setProcessing(true);
    setError('');
    try {
      await approvePeminjaman(id);
      setConfirmApprove(false);
      setToast({ message: 'Peminjaman berhasil disetujui.', type: 'success' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyetujui peminjaman.'));
      setConfirmApprove(false);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!alasan.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      await rejectPeminjaman(id, alasan);
      setToast({ message: 'Peminjaman berhasil ditolak.', type: 'success' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menolak peminjaman.'));
    } finally {
      setProcessing(false);
    }
  }

  if (!data && !error) return <StaffLayout title="Detail Peminjaman"><LoadingPage /></StaffLayout>;

  return (
    <StaffLayout title="Verifikasi Peminjaman" subtitle={data?.kode_referensi}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmModal
        isOpen={confirmApprove}
        title="Setujui Peminjaman"
        message="Setujui peminjaman ini? Stok APD akan otomatis berkurang sesuai jumlah yang dipinjam."
        confirmText="Ya, Setujui"
        variant="success"
        isLoading={processing}
        onConfirm={executeApprove}
        onCancel={() => setConfirmApprove(false)}
      />
      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 2 }}>{data.nama_mahasiswa}</div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  NIM {data.nim} · {data.divisi}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Foto Dokumentasi APD</div>
            <div className="photo-grid">
              {data.items.map((it) => (
                <div key={it.id}>
                  {it.foto_url ? (
                    <img src={assetUrl(it.foto_url)} alt={it.nama_apd} className="photo-thumb" />
                  ) : (
                    <div className="photo-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={24} color="#94a3b8" /></div>
                  )}
                  <p style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>{it.nama_apd}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Ukuran {it.ukuran}</p>
                </div>
              ))}
            </div>
          </div>

          {data.status === 'menunggu_verifikasi' && (
            <div className="card">
              <div className="card-title">Verifikasi</div>
              <p style={{ fontSize: 13, color: 'var(--gray-700)', marginBottom: 14 }}>
                Pastikan APD pada foto sesuai dengan yang baru dicoba mahasiswa di Ruangan HC,
                lalu setujui peminjaman.
              </p>

              {!showReject ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReject(true)}>
                    Tolak
                  </button>
                  <button className="btn btn-success" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => setConfirmApprove(true)}>
                    <Check size={16} /> Setujui Peminjaman
                  </button>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label>Alasan Penolakan</label>
                    <textarea className="input" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReject(false)}>
                      Batal
                    </button>
                    <button className="btn btn-danger" style={{ flex: 2 }} onClick={handleReject} disabled={processing}>
                      {processing ? <ButtonSpinner /> : 'Tolak Pengajuan'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {data.status !== 'menunggu_verifikasi' && (
            <button className="btn btn-outline btn-block" style={{ marginTop: 24 }} onClick={() => navigate('/hc/peminjaman-pengembalian')}>
              Kembali ke Daftar
            </button>
          )}
        </>
      )}
    </StaffLayout>
  );
}

