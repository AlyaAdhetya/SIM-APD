import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import QrScannerBox from '../../components/QrScannerBox';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { getPengembalianByQr, approvePengembalian, listPengembalian } from '../../api/pengembalian';
import { apiErrorMessage, assetUrl } from '../../api/client';
import { CheckCircle2, ImageOff, Check } from 'lucide-react';

export default function VerifikasiPengembalian() {
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pendingList, setPendingList] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  function loadPendingList() {
    listPengembalian('menunggu_verifikasi')
      .then((res) => setPendingList(res.data))
      .catch(() => {});
  }
  useEffect(() => { loadPendingList(); }, []);

  async function handleScanResult(token) {
    setScanError('');
    setResult(null);
    try {
      const res = await getPengembalianByQr(token);
      if (!res.data.pengembalian) {
        setScanError('Mahasiswa ini belum mengajukan pengembalian di aplikasi. Minta mahasiswa mengisi form pengembalian terlebih dahulu.');
        return;
      }
      setResult(res.data);
    } catch (err) {
      setScanError(apiErrorMessage(err, 'QR Code tidak dikenali.'));
    }
  }

  async function executeApprove() {
    setProcessing(true);
    try {
      await approvePengembalian(result.pengembalian.id);
      setResult(null);
      setConfirmApprove(false);
      loadPendingList();
      setToast({ message: 'Pengembalian berhasil disetujui. Stok APD telah diperbarui.', type: 'success' });
    } catch (err) {
      setScanError(apiErrorMessage(err, 'Gagal menyetujui pengembalian.'));
      setConfirmApprove(false);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <StaffLayout title="Verifikasi Pengembalian" subtitle="Scan QR Code dari HP mahasiswa">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmModal
        isOpen={confirmApprove}
        title="Setujui Pengembalian"
        message="Setujui pengembalian ini? Stok APD akan otomatis diperbarui sesuai item yang dikembalikan."
        confirmText="Ya, Setujui"
        variant="success"
        isLoading={processing}
        onConfirm={executeApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      {!result && (
        <>
          <QrScannerBox onResult={handleScanResult} />
          {scanError && <div className="alert alert-error" style={{ marginTop: 14 }}>{scanError}</div>}

          <div className="card" style={{ marginTop: 18 }}>
            <div className="card-title">Daftar Pengembalian Menunggu Verifikasi</div>
            {!pendingList && <LoadingPage label="Memuat..." />}
            {pendingList && pendingList.length === 0 && (
              <EmptyState icon={<CheckCircle2 size={40} strokeWidth={1.5} color="#16a34a" />} title="Tidak ada pengembalian yang menunggu" />
            )}
            {pendingList?.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <strong style={{ fontSize: 13.5 }}>{p.nama_mahasiswa}</strong>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{p.nim} · {p.kode_referensi}</p>
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => handleScanResult(p.qr_code_token)}>
                  Buka Detail
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {result && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 2 }}>{result.peminjaman.nama_mahasiswa}</div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  NIM {result.peminjaman.nim} · {result.peminjaman.divisi}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{result.peminjaman.kode_referensi}</p>
              </div>
              <StatusBadge status={result.pengembalian.status} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Kondisi APD yang Dikembalikan</div>
            <div className="photo-grid">
              {result.pengembalian.items.map((it) => (
                <div key={it.id}>
                  {it.foto_url ? (
                    <img src={assetUrl(it.foto_url)} alt={it.nama_apd} className="photo-thumb" />
                  ) : (
                    <div className="photo-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={24} color="#94a3b8" /></div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{it.nama_apd} ({it.ukuran})</p>
                    <StatusBadge status={it.kondisi} />
                  </div>
                  {it.catatan && <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{it.catatan}</p>}
                </div>
              ))}
            </div>
          </div>

          {scanError && <div className="alert alert-error">{scanError}</div>}

          {result.pengembalian.status === 'menunggu_verifikasi' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setResult(null)}>
                Batal
              </button>
              <button className="btn btn-success" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => setConfirmApprove(true)}>
                <Check size={16} /> Setujui Pengembalian
              </button>
            </div>
          ) : (
            <button className="btn btn-outline btn-block" onClick={() => setResult(null)}>Kembali ke Scanner</button>
          )}
        </>
      )}
    </StaffLayout>
  );
}

