import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { LoadingPage } from '../../components/Loading';
import { listRusakHilang, updateStatusRusakHilang } from '../../api/rusakHilang';
import { assetUrl } from '../../api/client';
import { CheckCircle2, ImageOff } from 'lucide-react';

export default function MonitoringRusakHilang() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const jenisMasalah = searchParams.get('jenis_masalah') || '';
  const statusPenanganan = searchParams.get('status_penanganan') || '';

  function load() {
    const filters = {};
    if (jenisMasalah) filters.jenis_masalah = jenisMasalah;
    if (statusPenanganan) filters.status_penanganan = statusPenanganan;
    listRusakHilang(filters)
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat data APD rusak/hilang.'));
  }
  useEffect(() => { load(); }, [jenisMasalah, statusPenanganan]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  async function handleUbahStatus(id, status) {
    try {
      await updateStatusRusakHilang(id, status);
      load();
    } catch (err) {
      setError('Gagal memperbarui status penanganan.');
    }
  }

  return (
    <StaffLayout title="APD Rusak / Hilang" subtitle="Hasil pengembalian yang dilaporkan rusak atau hilang">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: 180 }} value={jenisMasalah} onChange={(e) => updateFilter('jenis_masalah', e.target.value)}>
          <option value="">Semua Jenis Masalah</option>
          <option value="rusak">Rusak</option>
          <option value="hilang">Hilang</option>
        </select>
        <select className="input" style={{ maxWidth: 180 }} value={statusPenanganan} onChange={(e) => updateFilter('status_penanganan', e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="proses">Diproses</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!list && !error && <LoadingPage />}
      {list && list.length === 0 && <EmptyState icon={<CheckCircle2 size={40} strokeWidth={1.5} color="#16a34a" />} title="Tidak ada data APD rusak/hilang" />}

      {list?.map((r) => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {r.foto_url ? (
              <img src={assetUrl(r.foto_url)} alt={r.nama_apd} className="photo-thumb" style={{ width: 140, flexShrink: 0 }} />
            ) : (
              <div className="photo-thumb" style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={24} color="#94a3b8" /></div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{r.nama_apd} ({r.ukuran})</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  <StatusBadge status={r.jenis_masalah} />
                  <StatusBadge status={r.status_penanganan} />
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 4 }}>
                Mahasiswa: {r.nama_mahasiswa} ({r.nim}) · {r.divisi}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>Ref: {r.kode_referensi}</p>
              {r.catatan && <p style={{ fontSize: 13, marginTop: 6 }}>"{r.catatan}"</p>}
              <p style={{ fontSize: 11.5, color: 'var(--gray-500)', marginTop: 6 }}>
                Dilaporkan: {new Date(r.tgl_laporan).toLocaleString('id-ID')}
              </p>

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, marginRight: 8 }}>Status Penanganan:</label>
                <select
                  className="input"
                  style={{ width: 'auto', display: 'inline-block', padding: '6px 10px', fontSize: 13 }}
                  value={r.status_penanganan}
                  onChange={(e) => handleUbahStatus(r.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="proses">Diproses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
    </StaffLayout>
  );
}
