import { Doughnut, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import { SkeletonDashboard } from '../../components/Loading';
import Toast from '../../components/Toast';
import { getHsseSummary, getKepatuhanApd } from '../../api/dashboard';
import { listApd } from '../../api/apd';
import { listMahasiswa } from '../../api/mahasiswa';
import { exportToExcel, exportToPdf } from '../../utils/exportHelper';
import ChartContainer from '../../components/charts/ChartContainer';
import { FileSpreadsheet, FileText } from 'lucide-react';

export default function HsseDashboard() {
  const [summary, setSummary] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [error, setError] = useState('');
  const [exportingInventoris, setExportingInventoris] = useState(false);
  const [exportingMahasiswa, setExportingMahasiswa] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    let timer;
    function load() {
      Promise.allSettled([getHsseSummary(), getKepatuhanApd()])
        .then(([summaryResult, kepatuhanResult]) => {
          if (summaryResult.status === 'fulfilled') {
            setSummary(summaryResult.value);
            setError('');
          } else {
            setError('Gagal memuat ringkasan dashboard.');
          }
          if (kepatuhanResult.status === 'fulfilled') setComplianceData(kepatuhanResult.value);
        });
    }
    load();
    timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  if (!summary && !complianceData && !error) {
    return <StaffLayout title="Dashboard HSSE"><SkeletonDashboard /></StaffLayout>;
  }

  const complianceChart = complianceData && {
    labels: ['Patuh', 'Tidak Patuh'],
    datasets: [
      {
        data: [complianceData.patuh, complianceData.tidak_patuh],
        backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)'],
        borderWidth: 2,
      },
    ],
  };

  const inventorisChart = summary?.grafik_inventoris && {
    labels: ['Tersedia', 'Permintaan HC', 'Rusak', 'Hilang'],
    datasets: [
      {
        label: 'Jumlah Item',
        data: [
          summary.grafik_inventoris['Tersedia'] || 0,
          summary.grafik_inventoris['Permintaan HC'] || 0,
          summary.grafik_inventoris['Rusak'] || 0,
          summary.grafik_inventoris['Hilang'] || 0,
        ],
        backgroundColor: [
          'rgba(59,130,246,0.6)', // Tersedia - Blue
          'rgba(147,51,234,0.6)', // Permintaan - Purple
          'rgba(249,115,22,0.6)', // Rusak - Orange
          'rgba(239,68,68,0.6)'   // Hilang - Red
        ],
      }
    ]
  };

  async function handleExportInventoris(format) {
    setExportingInventoris(true);
    try {
      const res = await listApd();
      const apdList = res.data;
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
      if (format === 'excel') {
        exportToExcel(headers, data, 'Laporan_Inventoris_APD_HSSE');
      } else {
        exportToPdf('Laporan Akhir Inventoris APD (HSSE)', headers, data, 'Laporan_Inventoris_APD_HSSE');
      }
    } catch (err) {
      setToast({ message: 'Gagal mengekspor laporan inventoris.', type: 'error' });
    } finally {
      setExportingInventoris(false);
    }
  }

  async function handleExportMahasiswa(format) {
    setExportingMahasiswa(true);
    try {
      const res = await listMahasiswa();
      const mahasiswaList = res.data;
      const headers = ['NIM', 'Nama', 'Universitas', 'Divisi', 'Wajib APD', 'Tgl Mulai', 'Tgl Selesai', 'Status'];
      const data = mahasiswaList.map(m => [
        m.nim,
        m.nama,
        m.universitas || '-',
        m.divisi || '-',
        m.wajib_apd ? 'Ya' : 'Tidak',
        m.tgl_mulai || '-',
        m.tgl_selesai || '-',
        m.status.toUpperCase()
      ]);
      if (format === 'excel') {
        exportToExcel(headers, data, 'Laporan_Peminjaman_APD_Mahasiswa_Magang');
      } else {
        exportToPdf('Laporan Akhir Peminjaman APD Bagi Mahasiswa Magang', headers, data, 'Laporan_Peminjaman_APD_Mahasiswa_Magang');
      }
    } catch (err) {
      setToast({ message: 'Gagal mengekspor laporan peminjaman.', type: 'error' });
    } finally {
      setExportingMahasiswa(false);
    }
  }

  return (
    <StaffLayout title="Dashboard HSSE" subtitle="Diperbarui otomatis setiap 15 detik">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      {error && <div className="alert alert-error">{error}</div>}
      {summary && (
        <>
          <div className="stat-grid">
            <Link to="/hsse/rusak-hilang?jenis_masalah=rusak" className="stat-card accent-orange" style={{ textDecoration: 'none' }}>
              <div className="stat-value">{summary.total_rusak}</div>
              <div className="stat-label">Total APD Rusak</div>
            </Link>
            <Link to="/hsse/rusak-hilang?jenis_masalah=hilang" className="stat-card accent-red" style={{ textDecoration: 'none' }}>
              <div className="stat-value">{summary.total_hilang}</div>
              <div className="stat-label">Total APD Hilang</div>
            </Link>
            <Link to="/hsse/rusak-hilang?status_penanganan=pending" className="stat-card" style={{ textDecoration: 'none' }}>
              <div className="stat-value">{summary.pending_rusak_hilang}</div>
              <div className="stat-label">Belum Ditangani</div>
            </Link>
            <Link to="/hsse/permintaan-apd" className="stat-card accent-green" style={{ textDecoration: 'none' }}>
              <div className="stat-value">{summary.permintaan_pending}</div>
              <div className="stat-label">Permintaan APD dari HC</div>
            </Link>
          </div>

          {complianceChart && (
            <ChartContainer title="Kepatuhan APD Mahasiswa">
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
                <Doughnut
                  data={complianceChart}
                  options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </ChartContainer>
          )}

          {inventorisChart && (
            <ChartContainer title="Ringkasan Inventaris APD">
              <Bar 
                data={inventorisChart} 
                options={{ 
                  responsive: true, 
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }} 
              />
            </ChartContainer>
          )}

          <div className="card">
            <div className="card-title">Laporan Akhir Inventoris & Peminjaman</div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
              Ekspor laporan akhir untuk inventoris APD dan data peminjaman mahasiswa magang ke format Excel atau PDF.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Laporan Inventoris APD:</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleExportInventoris('excel')} disabled={exportingInventoris} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {exportingInventoris ? 'Mengekspor...' : <><FileSpreadsheet size={14} /> Excel</>}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleExportInventoris('pdf')} disabled={exportingInventoris} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {exportingInventoris ? 'Mengekspor...' : <><FileText size={14} /> PDF</>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Laporan Peminjaman Mahasiswa:</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleExportMahasiswa('excel')} disabled={exportingMahasiswa} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {exportingMahasiswa ? 'Mengekspor...' : <><FileSpreadsheet size={14} /> Excel</>}
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleExportMahasiswa('pdf')} disabled={exportingMahasiswa} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {exportingMahasiswa ? 'Mengekspor...' : <><FileText size={14} /> PDF</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Stok APD di HC Mendekati Batas Minimum</div>
            {summary.stok_rendah_hc.length === 0 ? (
              <p style={{ fontSize: 13 }}>Semua stok APD di HC masih aman.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Jenis APD</th><th>Ukuran</th><th>Stok Tersedia</th><th>Batas Minimum</th></tr>
                  </thead>
                  <tbody>
                    {summary.stok_rendah_hc.map(s => (
                      <tr key={s.apd_stok_id}>
                        <td>{s.nama_apd}</td>
                        <td>{s.ukuran}</td>
                        <td style={{ fontWeight: 700 }}>{s.stok_tersedia}</td>
                        <td>{s.batas_minimum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </StaffLayout>
  );
}
