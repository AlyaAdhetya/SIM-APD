import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import PhotoCapture from '../../components/PhotoCapture';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { detailPeminjaman } from '../../api/peminjaman';
import { createPengembalian } from '../../api/pengembalian';
import { apiErrorMessage } from '../../api/client';
import { CheckCircle2 } from 'lucide-react';

const KONDISI_OPTIONS = [
  { value: 'baik', label: 'Baik' },
  { value: 'rusak', label: 'Rusak' },
  { value: 'hilang', label: 'Hilang' },
];

export default function AjukanPengembalian() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [peminjaman, setPeminjaman] = useState(null);
  const [kondisiMap, setKondisiMap] = useState({});  // { [peminjaman_detail_id]: 'baik'|'rusak'|'hilang' }
  const [catatanMap, setCatatanMap] = useState({});
  const [fotoMap, setFotoMap] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    detailPeminjaman(id)
      .then((res) => {
        setPeminjaman(res.data);
        const initKondisi = {};
        res.data.items.forEach((it) => { initKondisi[it.id] = 'baik'; });
        setKondisiMap(initKondisi);
      })
      .catch(() => setError('Gagal memuat data peminjaman.'));
  }, [id]);

  async function handleSubmit() {
    const belumFoto = peminjaman.items.find((it) => !fotoMap[it.id]);
    if (belumFoto) {
      setError(`Foto kondisi untuk ${belumFoto.nama_apd} belum diambil.`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const items = peminjaman.items.map((it) => ({
        peminjaman_detail_id: it.id,
        kondisi: kondisiMap[it.id],
        catatan: catatanMap[it.id] || '',
      }));
      const fotos = peminjaman.items.map((it) => fotoMap[it.id]);
      const res = await createPengembalian(peminjaman.id, items, fotos);
      setSubmitted(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengirim pengajuan pengembalian.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!peminjaman && !error) return <MahasiswaLayout title="Ajukan Pengembalian" hideNav><LoadingPage /></MahasiswaLayout>;

  if (submitted) {
    return (
      <MahasiswaLayout title="Pengajuan Terkirim" hideNav>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={40} strokeWidth={1.5} color="#16a34a" /></div>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Pengajuan pengembalian berhasil dikirim</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>
            Staf HC akan memeriksa pengajuan Anda. Jika sudah disetujui, Staf HC akan menampilkan QR Code di layar komputer mereka.
          </p>
          <button className="btn btn-accent btn-block" onClick={() => navigate('/m/scan-pengembalian')}>
            Buka Scanner Kamera
          </button>
          <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => navigate('/m')}>
            Kembali ke Beranda
          </button>
        </div>
      </MahasiswaLayout>
    );
  }

  return (
    <MahasiswaLayout title="Ajukan Pengembalian APD" subtitle={peminjaman?.kode_referensi} hideNav>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="alert alert-info">
        Isi kondisi setiap APD dengan jujur, lalu ambil foto kondisinya saat ini.
      </div>

      {peminjaman?.items.map((it) => (
        <div className="card" key={it.id}>
          <div className="card-title">{it.nama_apd} ({it.ukuran})</div>

          <div className="field">
            <label>Kondisi Saat Dikembalikan</label>
            <select
              className="input"
              value={kondisiMap[it.id] || 'baik'}
              onChange={(e) => setKondisiMap((prev) => ({ ...prev, [it.id]: e.target.value }))}
            >
              {KONDISI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {kondisiMap[it.id] !== 'baik' && (
            <div className="field">
              <label>Catatan {kondisiMap[it.id] === 'rusak' ? 'Kerusakan' : 'Kehilangan'}</label>
              <textarea
                className="input"
                rows={2}
                placeholder={kondisiMap[it.id] === 'rusak' ? 'Contoh: Sobek di lengan kanan, ~10cm' : 'Contoh: Hilang di lokasi kantin'}
                value={catatanMap[it.id] || ''}
                onChange={(e) => setCatatanMap((prev) => ({ ...prev, [it.id]: e.target.value }))}
              />
            </div>
          )}

          <PhotoCapture
            label="Foto Kondisi APD"
            required
            onChange={(file) => setFotoMap((prev) => ({ ...prev, [it.id]: file }))}
          />
        </div>
      ))}

      <button className="btn btn-accent btn-block" style={{ marginTop: 8 }} onClick={handleSubmit} disabled={submitting}>
        {submitting ? <ButtonSpinner /> : 'Kirim Pengajuan Pengembalian'}
      </button>
    </MahasiswaLayout>
  );
}
