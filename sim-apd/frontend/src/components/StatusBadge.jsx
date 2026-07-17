const STATUS_MAP = {
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'amber' },
  menunggu: { label: 'Menunggu', color: 'amber' },
  disetujui: { label: 'Disetujui', color: 'blue' },
  ditolak: { label: 'Ditolak', color: 'red' },
  selesai: { label: 'Selesai', color: 'green' },
  aktif: { label: 'Aktif', color: 'green' },
  nonaktif: { label: 'Nonaktif', color: 'gray' },
  baik: { label: 'Baik', color: 'green' },
  rusak: { label: 'Rusak', color: 'amber' },
  hilang: { label: 'Hilang', color: 'red' },
  pending: { label: 'Pending', color: 'amber' },
  proses: { label: 'Diproses', color: 'blue' },
};

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status, color: 'gray' };
  return <span className={`badge badge-${info.color}`}>{info.label}</span>;
}
