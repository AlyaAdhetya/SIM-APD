import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { SkeletonTable } from '../../components/Loading';
import { listMahasiswa, updateStatusMahasiswa, updateMahasiswa, deleteMahasiswa } from '../../api/mahasiswa';
import { exportToExcel, exportToPdf } from '../../utils/exportHelper';

export default function DataMahasiswa() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [editData, setEditData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function load() {
    listMahasiswa(filter || undefined)
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat data mahasiswa.'));
  }

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, limit]);

  async function handleUbahStatus(id, status) {
    try {
      await updateStatusMahasiswa(id, status);
      load();
    } catch (err) {
      setError('Gagal mengubah status.');
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await updateMahasiswa(editData.id, editData);
      setEditData(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleteLoading(true);
      await deleteMahasiswa(deletingId);
      setDeletingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredList = list?.filter((m) => {
    const term = search.toLowerCase();
    return (
      (m.nim && m.nim.toLowerCase().includes(term)) ||
      (m.nama && m.nama.toLowerCase().includes(term))
    );
  });

  const startIndex = (page - 1) * limit;
  const paginatedList = filteredList?.slice(startIndex, startIndex + limit) || [];
  const totalPages = filteredList ? Math.ceil(filteredList.length / limit) : 0;

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    
    if (page <= 3) endPage = Math.min(5, totalPages);
    if (page >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  function handleExportExcel() {
    if (!filteredList || filteredList.length === 0) return;
    const headers = ['NIM', 'Nama', 'Universitas', 'Divisi', 'Wajib APD', 'Tgl Mulai', 'Tgl Selesai', 'Status'];
    const data = filteredList.map(m => [
      m.nim,
      m.nama,
      m.universitas || '-',
      m.divisi || '-',
      m.wajib_apd ? 'Ya' : 'Tidak',
      m.tgl_mulai || '-',
      m.tgl_selesai || '-',
      m.status.toUpperCase()
    ]);
    exportToExcel(headers, data, 'Laporan_Data_Mahasiswa_Magang');
  }

  function handleExportPdf() {
    if (!filteredList || filteredList.length === 0) return;
    const headers = ['NIM', 'Nama', 'Universitas', 'Divisi', 'Wajib APD', 'Tgl Mulai', 'Tgl Selesai', 'Status'];
    const data = filteredList.map(m => [
      m.nim,
      m.nama,
      m.universitas || '-',
      m.divisi || '-',
      m.wajib_apd ? 'Ya' : 'Tidak',
      m.tgl_mulai || '-',
      m.tgl_selesai || '-',
      m.status.toUpperCase()
    ]);
    exportToPdf('Laporan Akhir Data Mahasiswa Magang & Wajib APD', headers, data, 'Laporan_Data_Mahasiswa_Magang');
  }

  return (
    <StaffLayout title="Data Mahasiswa">
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
            value={filter} 
            onChange={(val) => setFilter(val)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'selesai', label: 'Selesai' },
              { value: 'nonaktif', label: 'Nonaktif' }
            ]}
            placeholder="Semua Status"
            style={{ width: 160 }}
          />
          <CustomSelect 
            value={limit} 
            onChange={(val) => setLimit(Number(val))}
            options={[
              { value: 10, label: '10 Data' },
              { value: 20, label: '20 Data' },
              { value: 30, label: '30 Data' },
              { value: 40, label: '40 Data' },
              { value: 50, label: '50 Data' },
              { value: 100, label: '100 Data' }
            ]}
            placeholder="Tampilkan"
            style={{ width: 120 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-excel" onClick={handleExportExcel} disabled={!filteredList || filteredList.length === 0}>
            <FileSpreadsheet size={18} />
            Ekspor Excel
          </button>
          <button className="btn-pdf" onClick={handleExportPdf} disabled={!filteredList || filteredList.length === 0}>
            <FileText size={18} />
            Ekspor PDF
          </button>
          <Link to="/hc/import-mahasiswa" className="btn btn-accent">+ Import Data Mahasiswa</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!list && !error && <SkeletonTable rows={10} />}
      
      {list && filteredList.length === 0 && <EmptyState icon="🧑‍🎓" title="Belum ada data mahasiswa yang cocok" />}

      {list && filteredList.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIM</th><th>Nama</th><th>Divisi</th><th>Wajib APD</th>
                  <th>Periode</th><th>Status</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nim}</td>
                    <td>{m.nama}</td>
                    <td>{m.divisi}</td>
                    <td>{m.wajib_apd ? 'Ya' : 'Tidak'}</td>
                    <td>{m.tgl_mulai} – {m.tgl_selesai}</td>
                    <td>
                      <CustomSelect 
                        value={m.status} 
                        onChange={(val) => handleUbahStatus(m.id, val)}
                        options={[
                          { value: 'aktif', label: 'Aktif' },
                          { value: 'selesai', label: 'Selesai' },
                          { value: 'nonaktif', label: 'Nonaktif' }
                        ]}
                        placeholder="Status"
                        style={{ minWidth: 120 }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditData(m)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeletingId(m.id)} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 13, color: 'var(--slate-500)' }}>
              Menampilkan {filteredList.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + limit, filteredList.length)} dari {filteredList.length} data
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(p)}
                  style={{ width: 32, padding: 0, justifyContent: 'center' }}
                >
                  {p}
                </button>
              ))}

              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--slate-800)', margin: 0 }}>Edit Data Mahasiswa</h2>
              <button onClick={() => setEditData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">NIM</label>
                <input type="text" className="input" value={editData.nim || ''} onChange={e => setEditData({...editData, nim: e.target.value})} required />
              </div>
              <div>
                <label className="label">Nama</label>
                <input type="text" className="input" value={editData.nama || ''} onChange={e => setEditData({...editData, nama: e.target.value})} required />
              </div>
              <div>
                <label className="label">Universitas</label>
                <input type="text" className="input" value={editData.universitas || ''} onChange={e => setEditData({...editData, universitas: e.target.value})} />
              </div>
              <div>
                <label className="label">Divisi</label>
                <input type="text" className="input" value={editData.divisi || ''} onChange={e => setEditData({...editData, divisi: e.target.value})} />
              </div>
              <div>
                <label className="label">Wajib APD</label>
                <CustomSelect value={editData.wajib_apd ? '1' : '0'} onChange={v => setEditData({...editData, wajib_apd: v === '1'})} options={[{value: '1', label: 'Ya'}, {value: '0', label: 'Tidak'}]} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Tanggal Mulai</label>
                  <input type="date" className="input" value={editData.tgl_mulai ? editData.tgl_mulai.substring(0,10) : ''} onChange={e => setEditData({...editData, tgl_mulai: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Tanggal Selesai</label>
                  <input type="date" className="input" value={editData.tgl_selesai ? editData.tgl_selesai.substring(0,10) : ''} onChange={e => setEditData({...editData, tgl_selesai: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditData(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Hapus Data Mahasiswa"
        message="Apakah Anda yakin ingin menghapus data mahasiswa ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
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
  maxWidth: 500, width: '100%',
  boxShadow: '0 8px 30px rgba(11,36,54,0.18)',
};
