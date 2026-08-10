import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { SkeletonTable } from '../../components/Loading';
import { listPeminjaman, deletePeminjaman } from '../../api/peminjaman';
import { saveExportHistory } from '../../api/exportHistory';
import { Link } from 'react-router-dom';
import { exportToTemplateExcel } from '../../utils/exportHelper';
import { Inbox, Trash2, Eye, FileSpreadsheet, History, X } from 'lucide-react';
import { ButtonSpinner } from '../../components/Loading';
import CustomSelect from '../../components/CustomSelect';

export default function PeminjamanPengembalian() {
  const [peminjamanList, setPeminjamanList] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState({ open: false, id: null, loading: false });
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPeriodLabel, setExportPeriodLabel] = useState('');

  function loadData() {
    listPeminjaman({ search, status: statusFilter })
      .then(res => setPeminjamanList(res.data))
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [search, statusFilter]);

  async function handleDeletePeminjaman(id) {
    setConfirmState({ open: true, id, loading: false });
  }

  async function executeConfirmAction() {
    setConfirmState(prev => ({ ...prev, loading: true }));
    try {
      await deletePeminjaman(confirmState.id);
      setToast({ message: 'Riwayat peminjaman berhasil dihapus.', type: 'success' });
      loadData();
      setConfirmState({ open: false, id: null, loading: false });
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Aksi gagal diproses.', type: 'error' });
      setConfirmState(prev => ({ ...prev, loading: false }));
    }
  }

  // Format data for excel template
  const formatDataForExcel = (list) => {
    return list.map((p, index) => {
      const formattedDate = new Date(p.tgl_pengajuan).toLocaleDateString('id-ID');
      const tglAmbil = p.status === 'disetujui' || p.status === 'selesai' ? formattedDate : '-';
      const tglKembali = p.tgl_selesai ? new Date(p.tgl_selesai).toLocaleDateString('id-ID') : '-';
      
      const daftarApd = p.daftar_apd ? '• ' + p.daftar_apd.split(', ').join('\n• ') : '-';
      
      let statusStr = p.status;
      if (statusStr === 'disetujui') statusStr = 'Aktif';
      else if (statusStr === 'menunggu_verifikasi') statusStr = 'Belum Diambil';
      else statusStr = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
      
      return [
        index + 1,
        p.kode_referensi,
        formattedDate,
        p.nama_mahasiswa,
        p.nim,
        p.divisi,
        daftarApd,
        p.total_item || 0,
        statusStr,
        tglAmbil,
        tglKembali
      ];
    });
  };

  const STATUS_LABEL_MAP = {
    '': 'Semua Status',
    'disetujui': 'Aktif',
    'menunggu_verifikasi': 'Belum Diambil',
    'selesai': 'Selesai',
  };

  async function handleExportConfirm() {
    setExporting(true);
    try {
      // Fetch data sesuai filter status yang aktif
      const res = await listPeminjaman({ status: statusFilter });
      const dataToExport = res.data || [];
      
      if (dataToExport.length === 0) {
        setToast({ message: 'Tidak ada data untuk diekspor dengan filter yang dipilih.', type: 'error' });
        setExporting(false);
        return;
      }

      const formattedData = formatDataForExcel(dataToExport);
      const statusSuffix = statusFilter ? `_${STATUS_LABEL_MAP[statusFilter] || statusFilter}` : '';
      const filename = `Laporan_Peminjaman${statusSuffix}_${(exportPeriodLabel || 'Laporan').replace(/[\s\-\:]+/g, '_')}_${Date.now()}`;

      // Export to Excel with custom label
      await exportToTemplateExcel(formattedData, filename, 8, exportPeriodLabel);
      
      // Save to History
      await saveExportHistory({
        label: exportPeriodLabel || 'Semua Waktu',
        periode_type: 'semua',
        periode_bulan: null,
        periode_tahun: null,
        data_snapshot: dataToExport,
        filename
      });

      setToast({ message: `Data berhasil diekspor (${STATUS_LABEL_MAP[statusFilter] || 'Semua Status'}) dan disimpan ke riwayat.`, type: 'success' });
      setExportModalOpen(false);
      
    } catch (err) {
      console.error(err);
      setToast({ message: 'Gagal mengekspor data.', type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <StaffLayout title="Manajemen Form Mahasiswa" subtitle="Pusat kontrol serah terima APD">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <ConfirmModal
        isOpen={confirmState.open}
        title="Hapus Riwayat"
        message="Apakah Anda yakin ingin menghapus pengajuan peminjaman ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={confirmState.loading}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmState({ open: false, id: null, loading: false })}
      />

      {/* Tools / Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 300 }}>
          <input
            type="text"
            className="input"
            placeholder="Cari NIM atau Nama..."
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CustomSelect 
            value={statusFilter} 
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'disetujui', label: 'Aktif' },
              { value: 'menunggu_verifikasi', label: 'Belum Diambil' },
              { value: 'selesai', label: 'Selesai' },
            ]}
            placeholder="Semua Status"
            style={{ width: 160 }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/hc/riwayat-ekspor" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: '12px' }}>
            <History size={18} /> Lihat Riwayat
          </Link>
          <button className="btn-excel" onClick={() => {
            setExportPeriodLabel('');
            setExportModalOpen(true);
          }}>
            <FileSpreadsheet size={18} /> Ekspor Excel
          </button>
        </div>
      </div>

      <div className="card">
        {!peminjamanList && <SkeletonTable rows={5} />}
        {peminjamanList && peminjamanList.length === 0 ? (
          <EmptyState icon={<Inbox size={48} strokeWidth={1.5} color="#94a3b8" />} title="Tidak ada pengajuan peminjaman" />
        ) : peminjamanList && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>No</th>
                  <th>Mahasiswa</th>
                  <th>NIM / Divisi</th>
                  <th>Waktu Pengajuan</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {peminjamanList.map((p, index) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.nama_mahasiswa}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.nim}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{p.divisi}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-main)' }}>
                        {new Date(p.tgl_pengajuan).toLocaleDateString('id-ID')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                        {new Date(p.tgl_pengajuan).toLocaleTimeString('id-ID')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.status === 'disetujui' && <span className="badge badge-success" style={{ background: 'var(--green-100)', color: 'var(--green-700)' }}>Aktif</span>}
                      {p.status === 'selesai' && <span className="badge badge-primary">Selesai</span>}
                      {p.status === 'menunggu_verifikasi' && <span className="badge badge-warning">Belum Diambil</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <Link to={`/hc/verifikasi-peminjaman/${p.id}`} className="btn btn-outline" style={{ padding: '6px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={16} /> Lihat Detail
                        </Link>
                        <button 
                          onClick={() => handleDeletePeminjaman(p.id)}
                          style={{ 
                            background: 'var(--red-50)', color: 'var(--red-600)', border: 'none', 
                            borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', cursor: 'pointer', transition: '0.2s' 
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--red-100)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'var(--red-50)'}
                          title="Hapus Pengajuan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Export Filter Modal */}
      {exportModalOpen && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--slate-800)', margin: 0 }}>Filter Ekspor Data</h2>
              <button onClick={() => setExportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Label Periode Laporan (di Excel)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contoh: 01 Juli 2026 - 31 Juli 2026"
                  value={exportPeriodLabel}
                  onChange={(e) => setExportPeriodLabel(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ background: 'var(--blue-50, #eff6ff)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--slate-700)', border: '1px solid var(--blue-200, #bfdbfe)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span>
                  Data yang akan diekspor: <b>{STATUS_LABEL_MAP[statusFilter] || 'Semua Status'}</b>.
                  {statusFilter && <span style={{ color: 'var(--slate-500)' }}> Ganti filter di halaman utama untuk mengubah cakupan ekspor.</span>}
                </span>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--slate-600)', border: '1px solid var(--slate-200)' }}>
                Data yang diekspor akan disimpan sebagai <b>Riwayat Ekspor</b> sehingga dapat diunduh ulang di masa mendatang dengan data yang sama persis (snapshot).
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setExportModalOpen(false)}>Batal</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleExportConfirm}
                  disabled={exporting}
                >
                  {exporting ? <ButtonSpinner /> : 'Ekspor & Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </StaffLayout>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(11,36,54,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 999, padding: 20,
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  padding: '24px 26px',
  maxWidth: 450, width: '100%',
  boxShadow: '0 8px 30px rgba(11,36,54,0.18)',
};
