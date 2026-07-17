import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import { listApd } from '../../api/apd';
import { createPermintaan, listPermintaan } from '../../api/permintaan';
import { apiErrorMessage } from '../../api/client';

export default function PermintaanApdHc() {
  const navigate = useNavigate();
  const [apdList, setApdList] = useState(null);
  const [jumlahMap, setJumlahMap] = useState({}); // { [apd_stok_id]: jumlah }
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listApd().then((res) => setApdList(res.data)).catch(() => setError('Gagal memuat data APD.'));
  }, []);

  async function handleSubmit() {
    const items = Object.entries(jumlahMap)
      .filter(([, jumlah]) => jumlah && Number(jumlah) > 0)
      .map(([stokId, jumlah]) => ({ apd_stok_id: stokId, jumlah_diminta: Number(jumlah) }));

    if (items.length === 0) {
      setError('Isi jumlah minimal satu jenis/ukuran APD yang diminta.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createPermintaan(items, catatan);
      setJumlahMap({});
      setCatatan('');
      setSuccess('Permintaan APD berhasil dikirim ke HSSE.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengirim permintaan APD.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!apdList && !error) return <StaffLayout title="Permintaan APD"><LoadingPage /></StaffLayout>;

  return (
    <StaffLayout title="Permintaan APD ke HSSE" subtitle="Ajukan restock saat stok menipis">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => navigate('/hc/riwayat-permintaan')}>
          Lihat Riwayat Permintaan
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-title">Buat Permintaan Baru</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Jenis APD</th>
                <th style={{ width: '20%' }}>Ukuran</th>
                <th style={{ width: '20%' }}>Stok Tersedia</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Jumlah Diminta</th>
              </tr>
            </thead>
            <tbody>
              {apdList?.flatMap((jenis) =>
                jenis.ukuran.map((u) => (
                  <tr key={u.apd_stok_id}>
                    <td>{jenis.nama_apd}</td>
                    <td>{u.ukuran}</td>
                    <td style={{ color: u.stok_rendah ? 'var(--red-600)' : 'inherit', fontWeight: u.stok_rendah ? 700 : 400 }}>
                      {u.stok_tersedia}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          className="input"
                          style={{ 
                            width: 90, 
                            padding: '8px 12px', 
                            textAlign: 'center',
                            border: '2px solid #0a192f',
                            borderRadius: '20px',
                            backgroundColor: '#ffffff',
                            color: '#0a192f',
                            fontWeight: '700'
                          }}
                          value={jumlahMap[u.apd_stok_id] || ''}
                          onChange={(e) => setJumlahMap((p) => ({ ...p, [u.apd_stok_id]: e.target.value }))}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Catatan untuk HSSE (opsional)</label>
          <textarea className="input" rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Stok wearpack L menipis karena gelombang magang baru" />
        </div>

        <button className="btn btn-accent" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <ButtonSpinner /> : 'Kirim Permintaan ke HSSE'}
        </button>
      </div>

    </StaffLayout>
  );
}
