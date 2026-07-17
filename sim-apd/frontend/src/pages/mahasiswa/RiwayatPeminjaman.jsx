import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MahasiswaLayout from '../../components/MahasiswaLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { LoadingPage } from '../../components/Loading';
import { listPeminjaman } from '../../api/peminjaman';
import api from '../../api/client';
import { FolderOpen, Trash2 } from 'lucide-react';

export default function RiwayatPeminjaman() {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function fetchList() {
    listPeminjaman()
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat riwayat.'));
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/peminjaman/delete/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchList(); // Refresh data setelah berhasil dihapus
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus riwayat');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <MahasiswaLayout title="Riwayat Peminjaman">
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      
      {!list && !error && <LoadingPage />}
      
      {list && list.length === 0 && (
        <EmptyState icon={<FolderOpen size={40} strokeWidth={1.5} color="#94a3b8" />} title="Belum ada riwayat peminjaman" />
      )}
      
      {list && list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((p) => (
            <div 
              key={p.id} 
              className="card hover-scale" 
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/m/peminjaman/${p.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text-main)' }}>
                    {p.kode_referensi}
                  </strong>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4, marginBottom: 8 }}>
                    {p.jumlah_item} item • {new Date(p.tgl_pengajuan).toLocaleDateString('id-ID')}
                  </p>
                  <StatusBadge status={p.status} />
                </div>

                {/* Tombol Hapus: Hanya muncul jika status BUKAN sedang dipinjam (disetujui) */}
                {p.status !== 'disetujui' && (
                  <button 
                    className="icon-btn" 
                    style={{ color: 'var(--red-600)', background: 'var(--red-50)', padding: 8, borderRadius: 8 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Mencegah navigasi detail saat tombol hapus diklik
                      setDeleteTarget(p);
                    }}
                    title="Hapus Riwayat"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.status === 'menunggu_verifikasi' ? "Batalkan Pengajuan" : "Hapus Riwayat"}
        message={
          deleteTarget?.status === 'menunggu_verifikasi' 
            ? `Yakin ingin membatalkan dan menghapus pengajuan peminjaman ${deleteTarget?.kode_referensi}?`
            : `Yakin ingin menghapus riwayat ${deleteTarget?.kode_referensi} dari daftar ini? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </MahasiswaLayout>
  );
}
