import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, AlertCircle } from 'lucide-react';

export default function QrScannerBox({ onResult }) {
  const elementId = 'qr-reader-box';
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const html5QrCode = new Html5Qrcode(elementId);
    html5QrCodeRef.current = html5QrCode;

    // Delay sedikit agar DOM siap
    setTimeout(() => {
      if (!isMounted) return;
      
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onResult(decodedText.trim());
        },
        (errorMessage) => {
          // ignore background scan errors (e.g. no qr found)
        }
      ).then(() => {
        setIsStarted(true);
      }).catch((err) => {
        console.error("Gagal memulai kamera", err);
        setError('Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera pada browser.');
      });
    }, 100);

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, color: 'var(--slate-800)', fontWeight: 600 }}>
        <ScanLine size={20} strokeWidth={2.5} className="text-primary" />
        <span>Scan QR Code HC</span>
      </div>
      
      {error && (
        <div style={{ background: 'var(--red-50)', color: 'var(--red-600)', padding: '12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', marginBottom: 16 }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', minHeight: 250 }}>
        {!isStarted && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
            <div className="spinner" style={{ marginBottom: 12 }}></div>
            <div style={{ fontSize: 13 }}>Mengaktifkan Kamera...</div>
          </div>
        )}
        <div id={elementId} style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }} />
      </div>
      
      <p style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 16 }}>
        Arahkan kamera ke QR Code di layar Staf HC. Scanner akan membaca otomatis.
      </p>
    </div>
  );
}
