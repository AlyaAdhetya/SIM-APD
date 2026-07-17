import { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Plus, X } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable, ButtonSpinner } from '../../components/Loading';
import ConfirmModal from '../../components/ConfirmModal';
import { listApd, createJenisApd, createStokApd, updateStokApd, nonaktifkanStokApd } from '../../api/apd';
import { apiErrorMessage } from '../../api/client';
import { exportToExcel, exportToPdf } from '../../utils/exportHelper';

export default function KelolaApd() {
  const [apdList, setApdList] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showJenisForm, setShowJenisForm] = useState(false);
  const [jenisForm, setJenisForm] = useState({ nama_apd: '', kategori: '', standar: '' });
  const [savingJenis, setSavingJenis] = useState(false);

  const [stokForm, setStokForm] = useState({});
  const [savingStokFor, setSavingStokFor] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ open: false, stokId: null, loading: false });

  function load() {
    listApd()
      .then((res) => setApdList(res.data))
      .catch(() => setError('Gagal memuat data APD.'));
  }
  useEffect(() => { load(); }, []);

  async function handleAddJenis(e) {
    e.preventDefault();
    setSavingJenis(true);
    setError('');
    try {
      await createJenisApd(jenisForm);
      setJenisForm({ nama_apd: '', kategori: '', standar: '' });
      setShowJenisForm(false);
      setSuccess('Jenis APD berhasil ditambahkan.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingJenis(false);
    }
  }

  async function handleAddStok(jenisId) {
    const form = stokForm[jenisId];
    if (!form?.ukuran || !form?.stok_total) {
      setError('Ukuran dan jumlah stok wajib diisi.');
      return;
    }
    setSavingStokFor(jenisId);
    setError('');
    try {
      await createStokApd({
        apd_jenis_id: jenisId,
        ukuran: form.ukuran,
        stok_total: form.stok_total,
        batas_minimum: form.batas_minimum || 5,
      });
      setStokForm((prev) => ({ ...prev, [jenisId]: { ukuran: '', stok_total: '', batas_minimum: '' } }));
      setSuccess('Stok ukuran baru berhasil ditambahkan.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingStokFor(null);
    }
  }

  async function handleUpdateBatasMin(stokId, value) {
    try {
      await updateStokApd({ id: stokId, batas_minimum: value });
      load();
    } catch (err) {
      setError('Gagal memperbarui batas minimum.');
    }
  }

  function handleNonaktifkanClick(stokId) {
    setConfirmModal({ open: true, stokId, loading: false });
  }

  async function executeNonaktifkan() {
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await nonaktifkanStokApd(confirmModal.stokId);
      load();
      setSuccess('Ukuran APD berhasil dinonaktifkan.');
      setConfirmModal({ open: false, stokId: null, loading: false });
    } catch (err) {
      setError('Gagal menonaktifkan stok APD.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  }

  function handleExportExcel() {
    if (!apdList || apdList.length === 0) return;
    const headers = ['Nama APD', 'Kategori', 'Standar', 'Ukuran', 'Total Stok', 'Stok Tersedia', 'Stok Dipinjam', 'Batas Minimum'];
    const data = [];
    apdList.forEach((jenis) => {
      jenis.ukuran.forEach((u) => {
        data.push([
          jenis.nama_apd,
          jenis.kategori || '-',
          jenis.standar || '-',
          u.ukuran,
          u.stok_total,
          u.stok_tersedia,
          u.stok_dipinjam,
          u.batas_minimum
        ]);
      });
    });
    exportToExcel(headers, data, 'Laporan_Inventoris_APD');
  }

  function handleExportPdf() {
    if (!apdList || apdList.length === 0) return;
    const headers = ['Nama APD', 'Kategori', 'Standar', 'Ukuran', 'Total Stok', 'Stok Tersedia', 'Stok Dipinjam', 'Batas Minimum'];
    const data = [];
    apdList.forEach((jenis) => {
      jenis.ukuran.forEach((u) => {
        data.push([
          jenis.nama_apd,
          jenis.kategori || '-',
          jenis.standar || '-',
          u.ukuran,
          u.stok_total,
          u.stok_tersedia,
          u.stok_dipinjam,
          u.batas_minimum
        ]);
      });
    });
    exportToPdf('Laporan Akhir Inventoris APD', headers, data, 'Laporan_Inventoris_APD');
  }

  if (!apdList && !error) return <StaffLayout title="Kelola APD"><SkeletonTable rows={8} /></StaffLayout>;

  return (
    <StaffLayout title="Kelola APD" subtitle="Master jenis APD & stok per ukuran">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Nonaktifkan Ukuran APD"
        message="Apakah Anda yakin ingin menonaktifkan ukuran APD ini? Ukuran ini tidak akan muncul lagi di form peminjaman mahasiswa."
        confirmText="Ya, Nonaktifkan"
        variant="danger"
        isLoading={confirmModal.loading}
        onConfirm={executeNonaktifkan}
        onCancel={() => setConfirmModal({ open: false, stokId: null, loading: false })}
      />

      <div style={{ display: 'flex', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-accent" onClick={() => setShowJenisForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showJenisForm ? <><X size={18} /> Tutup Form</> : <><Plus size={18} /> Tambah Jenis APD Baru</>}
        </button>
        <button className="btn btn-excel" onClick={handleExportExcel} disabled={!apdList || apdList.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileSpreadsheet size={16} /> Ekspor Excel
        </button>
        <button className="btn btn-pdf" onClick={handleExportPdf} disabled={!apdList || apdList.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={16} /> Ekspor PDF
        </button>
      </div>

      {showJenisForm && (
        <form className="card" onSubmit={handleAddJenis} style={{ marginBottom: 16 }}>
          <div className="card-title">Jenis APD Baru</div>
          <div className="field">
            <label>Nama APD</label>
            <input className="input" required value={jenisForm.nama_apd}
              onChange={(e) => setJenisForm((f) => ({ ...f, nama_apd: e.target.value }))} placeholder="Contoh: Sarung Tangan Safety" />
          </div>
          <div className="field">
            <label>Kategori</label>
            <input className="input" value={jenisForm.kategori}
              onChange={(e) => setJenisForm((f) => ({ ...f, kategori: e.target.value }))} placeholder="Contoh: Tangan" />
          </div>
          <div className="field">
            <label>Standar</label>
            <input className="input" value={jenisForm.standar}
              onChange={(e) => setJenisForm((f) => ({ ...f, standar: e.target.value }))} placeholder="Contoh: SNI xxxx" />
          </div>
          <button className="btn btn-primary" disabled={savingJenis}>
            {savingJenis ? <ButtonSpinner /> : 'Simpan Jenis APD'}
          </button>
        </form>
      )}

      {apdList?.map((jenis) => (
        <div className="card" key={jenis.id}>
          <div className="card-title">{jenis.nama_apd} <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>· {jenis.kategori}</span></div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Ukuran</th><th>Total</th><th>Tersedia</th><th>Dipinjam</th><th>Batas Min.</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {jenis.ukuran.map((u) => (
                  <tr key={u.apd_stok_id}>
                    <td>{u.ukuran}</td>
                    <td>{u.stok_total}</td>
                    <td style={{ color: u.stok_rendah ? 'var(--red-600)' : 'inherit', fontWeight: u.stok_rendah ? 700 : 400 }}>
                      {u.stok_tersedia}
                    </td>
                    <td>{u.stok_dipinjam}</td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ width: 70, padding: '6px 8px' }}
                        defaultValue={u.batas_minimum}
                        onBlur={(e) => handleUpdateBatasMin(u.apd_stok_id, e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleNonaktifkanClick(u.apd_stok_id)}>Nonaktifkan</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 100px' }}>
              <label>Ukuran Baru</label>
              <input className="input" placeholder="cth: XXL"
                value={stokForm[jenis.id]?.ukuran || ''}
                onChange={(e) => setStokForm((p) => ({ ...p, [jenis.id]: { ...p[jenis.id], ukuran: e.target.value } }))} />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 100px' }}>
              <label>Stok Awal</label>
              <input type="number" className="input"
                value={stokForm[jenis.id]?.stok_total || ''}
                onChange={(e) => setStokForm((p) => ({ ...p, [jenis.id]: { ...p[jenis.id], stok_total: e.target.value } }))} />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: '1 1 100px' }}>
              <label>Batas Min.</label>
              <input type="number" className="input" placeholder="5"
                value={stokForm[jenis.id]?.batas_minimum || ''}
                onChange={(e) => setStokForm((p) => ({ ...p, [jenis.id]: { ...p[jenis.id], batas_minimum: e.target.value } }))} />
            </div>
            <button className="btn btn-primary btn-sm" disabled={savingStokFor === jenis.id} onClick={() => handleAddStok(jenis.id)}>
              {savingStokFor === jenis.id ? <ButtonSpinner /> : '+ Tambah Ukuran'}
            </button>
          </div>
        </div>
      ))}
    </StaffLayout>
  );
}
