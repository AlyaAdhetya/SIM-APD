import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { listPermintaan, approvePermintaan, rejectPermintaan } from '../../api/permintaan';
import { apiErrorMessage } from '../../api/client';
import { Package, Check } from 'lucide-react';

export default function PermintaanApdHsse() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [confirmApprove, setConfirmApprove] = useState({ open: false, id: null });
  const [toast, setToast] = useState({ message: '', type: 'info' });

  function load() {
    listPermintaan()
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat daftar permintaan APD.'));
  }
  useEffect(() => { load(); }, []);

  async function executeApprove() {
    const id = confirmApprove.id;
    setProcessingId(id);
    setError('');
    try {
      await approvePermintaan(id);
      setConfirmApprove({ open: false, id: null });
      setToast({ message: 'Permintaan APD berhasil disetujui dan stok telah didistribusikan.', type: 'success' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyetujui permintaan.'));
      setConfirmApprove({ open: false, id: null });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id) {
    if (!alasan.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    setProcessingId(id);
    setError('');
    try {
      await rejectPermintaan(id, alasan);
      setRejectingId(null);
      setAlasan('');
      setToast({ message: 'Permintaan APD berhasil ditolak.', type: 'success' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menolak permintaan.'));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <StaffLayout title="Permintaan APD dari HC" subtitle="Setujui untuk otomatis menambah stok HC">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmModal
        isOpen={confirmApprove.open}
        title="Setujui Distribusi APD"
        message="Setujui dan distribusikan APD ini? Stok di HC akan otomatis bertambah sesuai jumlah yang diminta."
        confirmText="Ya, Distribusikan"
        variant="success"
        isLoading={processingId === confirmApprove.id}
        onConfirm={executeApprove}
        onCancel={() => setConfirmApprove({ open: false, id: null })}
      />

      {error && <div className="alert alert-error">{error}</div>}
      {!list && !error && <LoadingPage />}
      {list && list.length === 0 && <EmptyState icon={<Package size={40} strokeWidth={1.5} color="#94a3b8" />} title="Belum ada permintaan APD" />}

      {list?.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>{r.kode_permintaan}</strong>
              <p style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 2 }}>
                Diajukan oleh {r.diajukan_oleh_nama} · {new Date(r.tgl_pengajuan).toLocaleString('id-ID')}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>

          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="data-table">
              <thead><tr><th>Jenis APD</th><th>Ukuran</th><th>Jumlah Diminta</th></tr></thead>
              <tbody>
                {r.items.map((it, idx) => (
                  <tr key={idx}><td>{it.nama_apd}</td><td>{it.ukuran}</td><td>{it.jumlah_diminta}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {r.catatan && <p style={{ fontSize: 13, marginTop: 10 }}>Catatan HC: "{r.catatan}"</p>}
          {r.status === 'ditolak' && r.alasan_tolak && (
            <p style={{ fontSize: 13, color: 'var(--red-600)', marginTop: 6 }}>Alasan ditolak: {r.alasan_tolak}</p>
          )}

          {r.status === 'menunggu' && (
            rejectingId === r.id ? (
              <div style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Alasan Penolakan</label>
                  <textarea className="input" rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRejectingId(null)}>Batal</button>
                  <button className="btn btn-danger" style={{ flex: 2 }} onClick={() => handleReject(r.id)} disabled={processingId === r.id}>
                    {processingId === r.id ? <ButtonSpinner /> : 'Tolak Permintaan'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRejectingId(r.id)}>
                  Tolak
                </button>
                <button className="btn btn-success" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => setConfirmApprove({ open: true, id: r.id })}>
                  <Check size={16} /> Setujui & Distribusikan
                </button>
              </div>
            )
          )}
        </div>
      ))}
    </StaffLayout>
  );
}

