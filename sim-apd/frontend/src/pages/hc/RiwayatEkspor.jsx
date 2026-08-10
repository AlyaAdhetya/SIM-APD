import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { SkeletonTable } from '../../components/Loading';
import { listExportHistory, getExportData } from '../../api/exportHistory';
import { exportToTemplateExcel } from '../../utils/exportHelper';
import { History, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RiwayatEkspor() {
  const [exportHistoryList, setExportHistoryList] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  function loadHistory() {
    listExportHistory()
      .then(res => setExportHistoryList(res.data))
      .catch(() => {});
  }

  useEffect(() => {
    loadHistory();
  }, []);

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

  async function handleRedownload(historyId) {
    try {
      setToast({ message: 'Menyiapkan file unduhan...', type: 'info' });
      const res = await getExportData(historyId);
      const { data_snapshot, filename, label } = res.data;
      
      const formattedData = formatDataForExcel(data_snapshot);
      await exportToTemplateExcel(formattedData, filename, 8, label);
      
      setToast({ message: 'File berhasil diunduh.', type: 'success' });
    } catch (error) {
      setToast({ message: 'Gagal mengunduh ulang file.', type: 'error' });
    }
  }

  return (
    <StaffLayout title="Riwayat Ekspor Laporan" subtitle="Daftar ekspor laporan peminjaman & pengembalian">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div style={{ marginBottom: 16 }}>
        <Link to="/hc/peminjaman-pengembalian" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!exportHistoryList ? (
          <SkeletonTable rows={5} />
        ) : exportHistoryList.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate-500)' }}>
            Belum ada riwayat ekspor data.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Periode / Label</th>
                  <th>Waktu Ekspor</th>
                  <th>Diekspor Oleh</th>
                  <th style={{ textAlign: 'center' }}>Total Data</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {exportHistoryList.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{h.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>File: {h.filename}.xlsx</div>
                    </td>
                    <td>
                      {new Date(h.exported_at).toLocaleDateString('id-ID')} {new Date(h.exported_at).toLocaleTimeString('id-ID')}
                    </td>
                    <td>{h.exported_by}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-outline">{h.total_data} baris</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => handleRedownload(h.id)}
                        title="Unduh Ulang File"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Download size={16} /> Unduh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
