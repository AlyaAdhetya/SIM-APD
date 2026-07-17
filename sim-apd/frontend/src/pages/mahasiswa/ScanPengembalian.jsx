import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import QrScannerBox from '../../components/QrScannerBox';
import { LoadingPage } from '../../components/Loading';
import { apiErrorMessage } from '../../api/client';
import api from '../../api/client';
import { CheckCircle } from 'lucide-react';

export default function ScanPengembalian() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleScanResult(token) {
    if (processing || success) return;
    setError('');
    setProcessing(true);
    try {
      await api.post('/api/pengembalian/confirm-scan', { token });
      setSuccess(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memproses QR Code. Pastikan QR valid atau belum kadaluarsa.'));
      setProcessing(false);
    }
  }

  if (success) {
    return (
      <MahasiswaLayout title="Selesai" hideNav>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={64} color="var(--primary-color)" />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--slate-900)' }}>Pengembalian Berhasil!</h3>
          <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 24, lineHeight: 1.5 }}>
            Terima kasih telah mengembalikan APD. Status peminjaman Anda sekarang telah selesai.
          </p>
          <button className="btn btn-accent btn-block" onClick={() => navigate('/m')}>
            Kembali ke Beranda
          </button>
        </div>
      </MahasiswaLayout>
    );
  }

  return (
    <MahasiswaLayout title="Konfirmasi Pengembalian" subtitle="Serahkan APD ke Staff HC">
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--slate-600)' }}>
          Pastikan Staf HC sudah menekan tombol konfirmasi dan layar mereka memunculkan QR Code pengembalian.
        </p>
      </div>
        
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        
      {processing ? (
        <div className="card">
          <LoadingPage label="Memproses Pengembalian..." />
        </div>
      ) : (
        <QrScannerBox onResult={handleScanResult} />
      )}
    </MahasiswaLayout>
  );
}
