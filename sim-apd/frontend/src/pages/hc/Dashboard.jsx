import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PackageOpen, Package, Users } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import { SkeletonDashboard } from '../../components/Loading';
import { getHcSummary, getStokApd } from '../../api/dashboard';
import ReactECharts from 'echarts-for-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

export default function HcDashboard() {
  const [summary, setSummary] = useState(null);
  const [stokData, setStokData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    function load() {
      Promise.allSettled([getHcSummary(), getStokApd()])
        .then(([summaryResult, stokResult]) => {
          if (summaryResult.status === 'fulfilled') {
            setSummary(summaryResult.value);
            setError('');
          } else {
            setError('Gagal memuat ringkasan dashboard.');
          }
          if (stokResult.status === 'fulfilled') setStokData(stokResult.value);
        });
    }
    load();
    timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  if (!summary && !stokData && !error) {
    return <StaffLayout title="Dashboard HC"><SkeletonDashboard /></StaffLayout>;
  }

  // ── Palette ────────────────────────────────────────────────────────────────
  const INDIGO   = '#6366f1';
  const INDIGO_LIGHT = 'rgba(99,102,241,0.12)';
  const GREEN    = '#10b981';
  const ORANGE   = '#f97316';
  const SLATE    = '#64748b';
  const GRID_CLR = '#f1f5f9';

  // ── Chart 3: HORIZONTAL Bar — Peminjam per Divisi ────────────────────────
  const peminjamChart = summary?.grafik_peminjam?.length > 0 && {
    labels: summary.grafik_peminjam.map(d => d.divisi),
    datasets: [
      {
        label: 'Peminjam',
        data: summary.grafik_peminjam.map(d => Number(d.jumlah)),
        backgroundColor: INDIGO,
        hoverBackgroundColor: '#818cf8',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      },
    ],
  };

  const peminjamOpts = {
    indexAxis: 'y',          // ← horizontal: nama divisi jadi label Y (mudah dibaca)
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: { x: 14, y: 10 },
        cornerRadius: 8,
        callbacks: {
          label: ctx => `  ${ctx.parsed.x} pengajuan`,
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: SLATE,
        font: { family: 'Inter', size: 12, weight: '600' },
        formatter: v => (v > 0 ? v : ''),
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: GRID_CLR, borderDash: [4, 4] },
        border: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#94a3b8',
          stepSize: 1,
          precision: 0,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 12 },
          color: '#334155',
        },
      },
    },
  };

  // ── Chart 4: HORIZONTAL Stacked Bar — Stok APD ────────────────────────────
  const stokChart = stokData?.length > 0 && (() => {
    // Kelompokkan berdasarkan kategori (nama_apd) agar tidak memanjang per ukuran
    const groupedData = stokData.reduce((acc, curr) => {
      const name = curr.nama_apd;
      if (!acc[name]) {
        acc[name] = { nama_apd: name, stok_tersedia: 0, stok_dipinjam: 0, stok_total: 0 };
      }
      acc[name].stok_tersedia += Number(curr.stok_tersedia || 0);
      acc[name].stok_dipinjam += Number(curr.stok_dipinjam || 0);
      acc[name].stok_total += Number(curr.stok_total || 0);
      return acc;
    }, {});

    const aggregatedArray = Object.values(groupedData);

    return {
      aggregatedArray, // Disimpan untuk kalkulasi stokW nanti
      labels: aggregatedArray.map(s => s.nama_apd),
      datasets: [
        {
          label: 'Tersedia',
          data: aggregatedArray.map(s => s.stok_tersedia),
          backgroundColor: GREEN,
          hoverBackgroundColor: '#34d399',
          borderRadius: 0,
          borderSkipped: false,
          barThickness: 24,
        },
        {
          label: 'Dipinjam',
          data: aggregatedArray.map(s => s.stok_dipinjam),
          backgroundColor: ORANGE,
          hoverBackgroundColor: '#fb923c',
          borderRadius: { topRight: 6, bottomRight: 6 },
          borderSkipped: false,
          barThickness: 24,
        },
      ],
    };
  })();

  const stokOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: { x: 14, y: 10 },
        cornerRadius: 8,
        callbacks: {
          label: ctx => `  ${ctx.dataset.label}: ${ctx.parsed.x} unit`,
          afterBody: (items) => {
            const idx = items[0].dataIndex;
            // Akses array agregasi yang sudah kita simpan tadi
            const s = stokChart.aggregatedArray[idx];
            return [`  Total stok: ${s.stok_total} unit`];
          },
        },
      },
      datalabels: {
        anchor: 'center',
        align: 'center',
        color: '#ffffff',
        font: { family: 'Inter', size: 11, weight: '600' },
        formatter: (v) => (v > 0 ? v : ''),
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: { color: GRID_CLR, borderDash: [4, 4] },
        border: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#94a3b8',
          stepSize: 1,
          precision: 0
        },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 12 },
          color: '#334155',
        },
      },
    },
  };

  // ── Chart 5: ECharts 3D Donut — Radar Kepatuhan ───────────────────────────
  const kepatuhanOpts = summary?.kepatuhan && {
    tooltip: { 
      trigger: 'item', 
      backgroundColor: '#1e293b', 
      textStyle: { color: '#fff', fontFamily: 'Inter' },
      borderWidth: 0,
      formatter: '{b}: {c} mahasiswa ({d}%)'
    },
    legend: { 
      bottom: '0', 
      textStyle: { fontFamily: 'Inter', color: '#475569' },
      itemGap: 20
    },
    series: [
      {
        name: 'Status Kepatuhan',
        type: 'pie',
        radius: ['50%', '80%'], // Membuat donat tebal
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 12,
          borderColor: '#fff',
          borderWidth: 3,
          shadowBlur: 15,
          shadowOffsetX: 0,
          shadowOffsetY: 8,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { 
            show: true, 
            fontSize: '18', 
            fontWeight: 'bold',
            fontFamily: 'Inter'
          },
          itemStyle: {
            shadowBlur: 25,
            shadowOffsetY: 12,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            transform: 'scale(1.05)'
          }
        },
        labelLine: { show: false },
        data: [
          { value: Number(summary.kepatuhan.aman), name: 'Aman', itemStyle: { color: GREEN } },
          { value: Number(summary.kepatuhan.warning), name: 'Mendekati', itemStyle: { color: '#eab308' } },
          { value: Number(summary.kepatuhan.terlambat), name: 'Terlambat', itemStyle: { color: '#ef4444' } }
        ]
      }
    ]
  };

  const peminjamH = 200;
  const stokH     = 200;

  // Kalkulasi Metrik Kartu Atas
  const totalPeminjamanAktif = summary?.kepatuhan 
    ? Number(summary.kepatuhan.aman) + Number(summary.kepatuhan.warning) + Number(summary.kepatuhan.terlambat) 
    : 0;
  const totalStokTersedia = stokData ? stokData.reduce((a, s) => a + Number(s.stok_tersedia), 0) : 0;
  const totalStokDipinjam = stokData ? stokData.reduce((a, s) => a + Number(s.stok_dipinjam), 0) : 0;

  return (
    <StaffLayout title="Dashboard HC" subtitle="Selamat datang kembali! Berikut adalah pantauan aktivitas peminjaman dan stok APD hari ini.">
      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <>
          {/* Stat Cards Baru */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            
            {/* Card 1: Peminjaman Berjalan */}
            <div className="stat-card" style={{ borderTop: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">Peminjaman Berjalan</div>
                  <div className="stat-value">{totalPeminjamanAktif}</div>
                </div>
                <div style={{ padding: 12, background: '#eff6ff', borderRadius: '50%', color: '#3b82f6', display: 'flex' }}>
                  <ClipboardList size={28} />
                </div>
              </div>
            </div>

            {/* Card 2: Total APD Dipinjam */}
            <div className="stat-card" style={{ borderTop: '4px solid #f97316' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">Total APD Dipinjam</div>
                  <div className="stat-value">{totalStokDipinjam}</div>
                </div>
                <div style={{ padding: 12, background: '#fff7ed', borderRadius: '50%', color: '#f97316', display: 'flex' }}>
                  <PackageOpen size={28} />
                </div>
              </div>
            </div>

            {/* Card 3: Total APD Tersedia */}
            <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">Total APD Tersedia</div>
                  <div className="stat-value">{totalStokTersedia}</div>
                </div>
                <div style={{ padding: 12, background: '#ecfdf5', borderRadius: '50%', color: '#10b981', display: 'flex' }}>
                  <Package size={28} />
                </div>
              </div>
            </div>

            {/* Card 4: Mahasiswa Aktif */}
            <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">Mahasiswa Aktif</div>
                  <div className="stat-value">{summary.mahasiswa_aktif}</div>
                </div>
                <div style={{ padding: 12, background: '#f5f3ff', borderRadius: '50%', color: '#8b5cf6', display: 'flex' }}>
                  <Users size={28} />
                </div>
              </div>
            </div>

          </div>

          {/* Layout Baru: Kiri (Radar Besar), Kanan (Divisi + Stok Kecil) */}
          <div className="dashboard-row" style={{ display: 'flex', alignItems: 'stretch', gap: 20, marginBottom: 20 }}>
            
            {/* Kiri: Radar Kepatuhan */}
            <div className="card" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 20 }}>
                <div className="card-title" style={{ margin: 0 }}>Radar Kepatuhan Pengembalian</div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Status peminjaman aktif berdasarkan sisa waktu magang mahasiswa
                </p>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {summary.kepatuhan ? (
                  <ReactECharts option={kepatuhanOpts} style={{ height: 420, width: '100%' }} />
                ) : (
                  <EmptyChart label="Belum ada peminjaman aktif" height={420} />
                )}
              </div>
            </div>

            {/* Kanan: Peminjam per Divisi & Kondisi Stok */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Atas: Peminjam per Divisi */}
              <div className="card" style={{ width: '100%', flex: 1 }}>
                <div style={{ marginBottom: 12 }}>
                  <div className="card-title" style={{ margin: 0 }}>Peminjam per Divisi</div>
                </div>
                {peminjamChart ? (
                  <div style={{ height: peminjamH }}>
                    <Bar data={peminjamChart} options={peminjamOpts} />
                  </div>
                ) : (
                  <EmptyChart label="Belum ada data peminjaman" height={peminjamH} />
                )}
              </div>

              {/* Bawah: Kondisi Stok APD */}
              <div className="card" style={{ width: '100%', flex: 1 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title" style={{ margin: 0 }}>Kondisi Stok (Kategori)</div>
                  </div>
                  {/* Legend Mini */}
                  {stokData && stokData.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <LegendItem color={GREEN}  label="Tersedia"  total={stokData.reduce((a,s)=>a+Number(s.stok_tersedia),0)} />
                      <LegendItem color={ORANGE} label="Dipinjam"  total={stokData.reduce((a,s)=>a+Number(s.stok_dipinjam||0),0)} />
                    </div>
                  )}
                </div>

                {stokChart ? (
                  <div style={{ height: stokH }}>
                    <Bar data={stokChart} options={stokOpts} />
                  </div>
                ) : (
                  <EmptyChart label="Belum ada data stok APD" height={stokH} />
                )}
              </div>

            </div>

          </div>

          {/* Alert Stok Rendah */}
          {summary.stok_rendah.length > 0 && (
            <div className="card" style={{
              borderLeft: '4px solid #ef4444',
              background: '#fff7f7',
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 15 }}>
                  Stok Mendekati Batas Minimum
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {summary.stok_rendah.map(s => (
                  <div key={s.apd_stok_id} style={{
                    background: '#fff',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <span style={{ fontWeight: 600, color: '#7f1d1d' }}>{s.nama_apd}</span>
                    {s.ukuran && <span style={{ color: '#94a3b8', fontSize: 12 }}>{s.ukuran}</span>}
                    <span style={{
                      background: '#fee2e2', color: '#ef4444',
                      borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: 12
                    }}>
                      {s.stok_tersedia} / min {s.batas_minimum}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/hc/permintaan-apd" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                Buat Permintaan Restock
              </Link>
            </div>
          )}
        </>
      )}
    </StaffLayout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function EmptyChart({ label, height }) {
  return (
    <div style={{
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#94a3b8',
      fontSize: 13,
      background: '#f8fafc',
      borderRadius: 8,
      border: '1.5px dashed #e2e8f0',
    }}>
      {label}
    </div>
  );
}

function LegendItem({ color, label, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-block', width: 12, height: 12,
        borderRadius: 3, background: color, flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
      <span style={{
        background: '#f1f5f9', color: '#334155',
        borderRadius: 20, padding: '1px 10px', fontSize: 12, fontWeight: 700,
      }}>{total}</span>
    </div>
  );
}
