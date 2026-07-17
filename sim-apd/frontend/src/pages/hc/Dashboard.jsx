import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import { SkeletonDashboard } from '../../components/Loading';
import { getHcSummary, getStatusPeminjaman, getPenggunaanApd } from '../../api/dashboard';
import ChartContainer from '../../components/charts/ChartContainer';

export default function HcDashboard() {
  const [summary, setSummary] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    function load() {
      // Use allSettled so summary still displays even if chart endpoints fail
      Promise.allSettled([getHcSummary(), getStatusPeminjaman(), getPenggunaanApd()])
        .then(([summaryResult, statusResult, usageResult]) => {
          if (summaryResult.status === 'fulfilled') {
            setSummary(summaryResult.value);
            setError('');
          } else {
            setError('Gagal memuat ringkasan dashboard.');
          }
          if (statusResult.status === 'fulfilled') setStatusData(statusResult.value);
          if (usageResult.status === 'fulfilled') setUsageData(usageResult.value);
        });
    }
    load();
    timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  if (!summary && !statusData && !usageData && !error) {
    return <StaffLayout title="Dashboard HC"><SkeletonDashboard /></StaffLayout>;
  }

  const barOpts = { 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top',
        labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 20 }
      },
      tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: '#e2e8f0', borderDash: [4, 4] }, border: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, padding: 8 } }
    }
  };

  const statusChart = statusData && {
    labels: statusData.map(d => d.nama_divisi),
    datasets: [
      { label: 'Dipinjam', data: statusData.map(d => d.dipinjam), backgroundColor: '#f59e0b', borderRadius: 6 },
      { label: 'Kembali',  data: statusData.map(d => d.kembali),  backgroundColor: '#22c55e', borderRadius: 6 },
      { label: 'Overdue',  data: statusData.map(d => d.overdue),  backgroundColor: '#ef4444', borderRadius: 6 },
    ],
  };

  const usageChart = usageData && {
    labels: usageData.map(a => a.nama_apd),
    datasets: [
      { label: 'Total Dipinjam',  data: usageData.map(a => a.total),           backgroundColor: '#3b82f6', borderRadius: 6 },
      { label: 'Sedang Dipinjam', data: usageData.map(a => a.sedang_dipinjam), backgroundColor: '#f97316', borderRadius: 6 },
    ],
  };

  const peminjamChart = summary?.grafik_peminjam && summary.grafik_peminjam.length > 0 && {
    labels: summary.grafik_peminjam.map(d => d.divisi),
    datasets: [
      { label: 'Jumlah Peminjam', data: summary.grafik_peminjam.map(d => d.jumlah), backgroundColor: '#8b5cf6', borderRadius: 6 },
    ],
  };

  return (
    <StaffLayout title="Dashboard HC" subtitle="Diperbarui otomatis setiap 15 detik">
      {error && <div className="alert alert-error">{error}</div>}
      {summary && (
        <>
          <div className="stat-grid">
            <Link to="/hc/peminjaman-pengembalian" className="stat-card" style={{ borderTop: '4px solid #f97316' }}>
              <div className="stat-label">Peminjaman Menunggu Verifikasi</div>
              <div className="stat-value">{summary.pending_peminjaman}</div>
            </Link>
            <Link to="/hc/peminjaman-pengembalian" className="stat-card" style={{ borderTop: '4px solid #ea580c' }}>
              <div className="stat-label">Pengembalian Menunggu Verifikasi</div>
              <div className="stat-value">{summary.pending_pengembalian}</div>
            </Link>
            <Link to="/hc/data-mahasiswa" className="stat-card" style={{ borderTop: '4px solid #22c55e' }}>
              <div className="stat-label">Mahasiswa Aktif</div>
              <div className="stat-value">{summary.mahasiswa_aktif}</div>
            </Link>
            <Link to="/hc/permintaan-apd" className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
              <div className="stat-label">Permintaan APD ke HSSE</div>
              <div className="stat-value">{summary.permintaan_pending}</div>
            </Link>
          </div>

          <div className="dashboard-row">
            {statusChart && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-title">Status Peminjaman APD per Divisi</div>
                <div style={{ flex: 1 }}>
                  <Bar data={statusChart} options={barOpts} />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title">Stok Mendekati Batas</div>
              {summary.stok_rendah.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>Semua stok APD masih aman.</p>
              ) : (
                <div className="low-stock-list">
                  {summary.stok_rendah.slice(0,5).map(s => (
                    <div key={s.apd_stok_id} className="low-stock-item">
                      <div>
                        <div className="title">{s.nama_apd}</div>
                        <div className="desc">Ukuran {s.ukuran} · Sisa {s.stok_tersedia} / {s.batas_minimum}</div>
                      </div>
                      <div className="badge badge-danger">KRITIS</div>
                    </div>
                  ))}
                </div>
              )}
              {summary.stok_rendah.length > 0 && (
                <Link to="/hc/permintaan-apd" className="btn btn-primary btn-block" style={{ marginTop: 24 }}>
                  Pesan Sekarang
                </Link>
              )}
            </div>
          </div>

          <div className="dashboard-row">
            {usageChart && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-title">Penggunaan APD Terpopuler</div>
                <div style={{ flex: 1 }}>
                  <Bar data={usageChart} options={barOpts} />
                </div>
              </div>
            )}
            
            {peminjamChart && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-title">Jumlah Peminjam per Divisi</div>
                <div style={{ flex: 1 }}>
                  <Bar data={peminjamChart} options={barOpts} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </StaffLayout>
  );
}
