import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import PhotoCapture from '../../components/PhotoCapture';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { listApd } from '../../api/apd';
import { createPeminjaman } from '../../api/peminjaman';
import { apiErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AjukanPeminjaman() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: pilih alat, 2: foto, 3: review
  const [apdList, setApdList] = useState(null);
  const [selected, setSelected] = useState({}); // { [jenisId]: apd_stok_id }
  const [fotoMap, setFotoMap] = useState({}); // { [apd_stok_id]: File }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listApd(true)
      .then((res) => setApdList(res.data))
      .catch(() => setError('Gagal memuat daftar APD.'));
  }, []);

  const items = Object.entries(selected)
    .filter(([, stokId]) => stokId)
    .map(([jenisId, stokId]) => {
      const jenis = apdList.find((j) => String(j.id) === String(jenisId));
      const ukuran = jenis.ukuran.find((u) => String(u.apd_stok_id) === String(stokId));
      return { jenisId, jenis_label: jenis.nama_apd, apd_stok_id: stokId, ukuran_label: ukuran?.ukuran };
    });

  function toggleJenis(jenisId, checked) {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[jenisId] = next[jenisId] || '';
      else delete next[jenisId];
      return next;
    });
  }

  function pilihUkuran(jenisId, stokId) {
    setSelected((prev) => ({ ...prev, [jenisId]: stokId }));
  }

  function goToFotoStep() {
    if (items.length === 0) {
      setError('Pilih minimal satu APD yang sudah dicoba dan pas ukurannya.');
      return;
    }
    if (items.some((it) => !it.apd_stok_id)) {
      setError('Pilih ukuran untuk setiap APD yang dicentang.');
      return;
    }
    setError('');
    setStep(2);
  }

  function goToReviewStep() {
    const belumFoto = items.find((it) => !fotoMap[it.apd_stok_id]);
    if (belumFoto) {
      setError(`Foto untuk ${belumFoto.jenis_label} belum diambil.`);
      return;
    }
    setError('');
    setStep(3);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payloadItems = items.map((it) => ({ apd_stok_id: it.apd_stok_id }));
      const fotos = items.map((it) => fotoMap[it.apd_stok_id]);
      const res = await createPeminjaman(user?.tgl_selesai, payloadItems, fotos);
      navigate(`/m/peminjaman/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengirim pengajuan peminjaman.'));
      setSubmitting(false);
    }
  }

  if (!apdList) return <MahasiswaLayout title="Ajukan Peminjaman" hideNav><LoadingPage /></MahasiswaLayout>;

  return (
    <MahasiswaLayout title="Ajukan Peminjaman APD" subtitle={`Langkah ${step} dari 3`} hideNav>
      <div className="steps-row">
        <div className={`step-dot ${step >= 1 ? 'done' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'done' : ''}`} />
        <div className={`step-dot ${step >= 3 ? 'done' : ''}`} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {step === 1 && (
        <>
          <div className="alert alert-info">
            Centang APD yang sudah Anda coba bersama HC Staff, lalu pilih ukuran yang pas.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {apdList.map((jenis) => {
              const checked = jenis.id in selected;
              return (
                <div className="card" key={jenis.id}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: checked ? 12 : 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      style={{ width: 18, height: 18, margin: 0 }}
                      onChange={(e) => toggleJenis(jenis.id, e.target.checked)}
                    />
                    <strong>{jenis.nama_apd}</strong>
                  </label>

                {checked && (
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Ukuran yang pas</label>
                    <select
                      className="input"
                      value={selected[jenis.id] || ''}
                      onChange={(e) => pilihUkuran(jenis.id, e.target.value)}
                    >
                      <option value="">-- Pilih ukuran --</option>
                      {jenis.ukuran.map((u) => (
                        <option key={u.apd_stok_id} value={u.apd_stok_id} disabled={u.stok_tersedia < 1}>
                          {u.ukuran} {u.stok_tersedia < 1 ? '(stok kosong)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          <button className="btn btn-accent btn-block" style={{ marginTop: 24 }} onClick={goToFotoStep}>
            Lanjut: Ambil Foto →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="alert alert-info">
            Ambil foto setiap APD sebagai bukti dokumentasi kondisi awal.
          </div>
          {items.map((it) => (
            <PhotoCapture
              key={it.apd_stok_id}
              label={`${it.jenis_label} (${it.ukuran_label})`}
              required
              onChange={(file) => setFotoMap((prev) => ({ ...prev, [it.apd_stok_id]: file }))}
            />
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Kembali</button>
            <button className="btn btn-accent" style={{ flex: 2 }} onClick={goToReviewStep}>Lanjut: Review →</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="card">
            <div className="card-title">Review Pengajuan</div>
            {items.map((it) => (
              <div key={it.apd_stok_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 13.5 }}>{it.jenis_label} ({it.ukuran_label})</span>
                <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 700 }}>Foto OK</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="confirm" required style={{ width: 20, height: 20, margin: 0, flexShrink: 0 }} />
            <label htmlFor="confirm" style={{ fontWeight: 500, margin: 0, cursor: 'pointer', lineHeight: 1.4 }}>
              Saya menyatakan data di atas sudah benar dan APD sudah saya coba langsung di Ruangan HC.
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={submitting}>Kembali</button>
            <button className="btn btn-accent" style={{ flex: 2 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <ButtonSpinner /> : 'Kirim Pengajuan'}
            </button>
          </div>
        </>
      )}
    </MahasiswaLayout>
  );
}
