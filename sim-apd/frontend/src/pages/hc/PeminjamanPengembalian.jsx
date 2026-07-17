import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { SkeletonTable, ButtonSpinner } from '../../components/Loading';
import { listPeminjaman, deletePeminjaman } from '../../api/peminjaman';
import { listPengembalian, approvePengembalian, deletePengembalian, confirmScanPengembalian } from '../../api/pengembalian';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Inbox, PackageOpen, Trash2, ShieldAlert } from 'lucide-react';

export default function PeminjamanPengembalian() {
  const [activeTab, setActiveTab] = useState('peminjaman'); // 'peminjaman' | 'pengembalian'
  
  const [peminjamanList, setPeminjamanList] = useState(null);
  const [pengembalianList, setPengembalianList] = useState(null);
  
  const [qrModal, setQrModal] = useState({ open: false, token: '', loading: false });
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState({ open: false, type: '', id: null, loading: false });

  function loadData() {
    listPeminjaman('menunggu_verifikasi').then(res => setPeminjamanList(res.data)).catch(() => {});
    listPengembalian('menunggu_verifikasi').then(res => setPengembalianList(res.data)).catch(() => {});
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  async function handleApprovePengembalian(id) {
    setConfirmState({ open: true, type: 'approve_pengembalian', id, loading: false });
  }

  async function handleDeletePeminjaman(id) {
    setConfirmState({ open: true, type: 'peminjaman', id, loading: false });
  }

  async function handleDeletePengembalian(id) {
    setConfirmState({ open: true, type: 'pengembalian', id, loading: false });
  }

  async function executeConfirmAction() {
    setConfirmState(prev => ({ ...prev, loading: true }));
    try {
      if (confirmState.type === 'peminjaman') {
        await deletePeminjaman(confirmState.id);
        setToast({ message: 'Riwayat peminjaman berhasil dihapus.', type: 'success' });
      } else if (confirmState.type === 'pengembalian') {
        await deletePengembalian(confirmState.id);
        setToast({ message: 'Riwayat pengembalian berhasil dihapus.', type: 'success' });
      } else if (confirmState.type === 'approve_pengembalian') {
        const res = await approvePengembalian(confirmState.id);
        setQrModal({ open: true, token: res.data.token, loading: false });
        setToast({ message: 'Pengembalian disetujui, QR Code berhasil dibuat.', type: 'success' });
      }
      loadData();
      setConfirmState({ open: false, type: '', id: null, loading: false });
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Aksi gagal diproses.', type: 'error' });
      setConfirmState(prev => ({ ...prev, loading: false }));
    }
  }

  function handleManualConfirmClick() {
    setConfirmState({ open: true, type: 'manual_backdoor', id: null, loading: false });
  }

  async function executeManualConfirm() {
    setConfirmState(prev => ({ ...prev, loading: true }));
    try {
      await confirmScanPengembalian(qrModal.token);
      setToast({ message: 'Pengembalian berhasil dikonfirmasi secara manual (Backdoor).', type: 'success' });
      setQrModal({ open: false, token: '', loading: false });
      setConfirmState({ open: false, type: '', id: null, loading: false });
      loadData();
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Gagal melakukan konfirmasi manual.', type: 'error' });
      setConfirmState(prev => ({ ...prev, loading: false }));
    }
  }

  const getConfirmDetails = () => {
    return {
      approve_pengembalian: {
        title: "Konfirmasi Pengembalian",
        message: "Setujui pengembalian ini dan generate QR Code sekarang?",
        confirmText: "Ya, Setujui",
        variant: "success"
      },
      manual_backdoor: {
        title: "Konfirmasi Manual (Backdoor)",
        message: "Anda akan mengkonfirmasi pengembalian ini secara manual tanpa melalui proses scan QR oleh mahasiswa. Pastikan barang APD sudah benar-benar diterima kembali.",
        confirmText: "Ya, Konfirmasi Manual",
        variant: "danger"
      },
      peminjaman: {
        title: "Hapus Riwayat",
        message: "Apakah Anda yakin ingin menghapus pengajuan peminjaman ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
        confirmText: "Ya, Hapus",
        variant: "danger"
      },
      pengembalian: {
        title: "Hapus Riwayat",
        message: "Apakah Anda yakin ingin menghapus pengajuan pengembalian ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
        confirmText: "Ya, Hapus",
        variant: "danger"
      }
    }[confirmState.type] || { title: 'Konfirmasi', message: '', confirmText: 'Ya', variant: 'primary' };
  };

  const confirmDetails = getConfirmDetails();

  return (
    <StaffLayout title="Verifikasi Peminjaman & Pengembalian" subtitle="Pusat kontrol serah terima APD">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmDetails.title}
        message={confirmDetails.message}
        confirmText={confirmDetails.confirmText}
        variant={confirmDetails.variant}
        isLoading={confirmState.loading}
        onConfirm={confirmState.type === 'manual_backdoor' ? executeManualConfirm : executeConfirmAction}
        onCancel={() => setConfirmState({ open: false, type: '', id: null, loading: false })}
      />
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: '#e2e8f0', padding: 6, borderRadius: 16, width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('peminjaman')}
          style={{ 
            background: activeTab === 'peminjaman' ? 'white' : 'transparent', 
            border: 'none', 
            padding: '10px 24px', 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: 12,
            color: activeTab === 'peminjaman' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: activeTab === 'peminjaman' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Peminjaman Baru
        </button>
        <button 
          onClick={() => setActiveTab('pengembalian')}
          style={{ 
            background: activeTab === 'pengembalian' ? 'white' : 'transparent', 
            border: 'none', 
            padding: '10px 24px', 
            fontSize: 14, 
            fontWeight: 600,
            borderRadius: 12,
            color: activeTab === 'pengembalian' ? 'var(--text-main)' : 'var(--text-muted)',
            boxShadow: activeTab === 'pengembalian' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Pengembalian APD
        </button>
      </div>

      {activeTab === 'peminjaman' && (
        <div className="card">
          {!peminjamanList && <SkeletonTable rows={5} />}
          {peminjamanList && peminjamanList.length === 0 ? (
            <EmptyState icon={<Inbox size={48} strokeWidth={1.5} color="#94a3b8" />} title="Tidak ada pengajuan peminjaman baru" />
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
                        {p.status === 'menunggu_verifikasi' && <span className="badge badge-warning">Menunggu</span>}
                        {p.status === 'disetujui' && <span className="badge badge-success" style={{ background: 'var(--green-100)', color: 'var(--green-700)' }}>Disetujui</span>}
                        {p.status === 'ditolak' && <span className="badge badge-danger" style={{ background: 'var(--red-100)', color: 'var(--red-700)' }}>Ditolak</span>}
                        {p.status === 'selesai' && <span className="badge badge-primary">Selesai</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <Link to={`/hc/verifikasi-peminjaman/${p.id}`} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
                            Review & Setujui
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
      )}

      {activeTab === 'pengembalian' && (
        <div className="card">
          {!pengembalianList && <SkeletonTable rows={5} />}
          {pengembalianList && pengembalianList.length === 0 ? (
            <EmptyState icon={<PackageOpen size={48} strokeWidth={1.5} color="#94a3b8" />} title="Tidak ada pengajuan pengembalian baru" />
          ) : pengembalianList && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>No</th>
                    <th>Mahasiswa</th>
                    <th>Kode Referensi</th>
                    <th>Waktu Pengajuan</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pengembalianList.map((p, index) => (
                    <tr key={p.id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.nama_mahasiswa}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', background: 'var(--slate-100)', padding: '4px 8px', borderRadius: 6, fontSize: 13 }}>
                          {p.kode_referensi}
                        </span>
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
                        {p.status === 'menunggu_verifikasi' && <span className="badge badge-warning">Menunggu</span>}
                        {p.status === 'disetujui' && <span className="badge badge-success" style={{ background: 'var(--green-100)', color: 'var(--green-700)' }}>Disetujui</span>}
                        {p.status === 'selesai' && <span className="badge badge-primary">Selesai</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 16px', fontSize: 13 }}
                            onClick={() => handleApprovePengembalian(p.id)}
                          >
                            Konfirmasi & Buat QR
                          </button>
                          <button 
                            onClick={() => handleDeletePengembalian(p.id)}
                            style={{ 
                              background: 'var(--red-50)', color: 'var(--red-600)', border: 'none', 
                              borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', 
                              justifyContent: 'center', cursor: 'pointer', transition: '0.2s' 
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--red-100)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--red-50)'}
                            title="Hapus Pengembalian"
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
      )}

      {/* QR Modal */}
      {qrModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15,23,42,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: 400, width: '90%', textAlign: 'center', padding: 40 }}>
            <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--slate-900)' }}>Scan QR Code Ini</h3>
            <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 24 }}>
              Minta mahasiswa untuk membuka aplikasi mereka dan melakukan scan pada layar ini untuk memfinalisasi pengembalian.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <QRCodeSVG value={qrModal.token} size={220} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-outline btn-block" onClick={() => setQrModal({ open: false, token: '', loading: false })}>
                Tutup Modal
              </button>
              
              <button 
                className="btn btn-danger btn-block" 
                style={{ 
                  background: 'var(--orange-50)', color: 'var(--orange-700)', borderColor: 'var(--orange-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
                }}
                onClick={handleManualConfirmClick}
                disabled={qrModal.loading}
                title="Gunakan ini jika mahasiswa gagal melakukan scan (misal kamera rusak)"
              >
                {qrModal.loading ? <ButtonSpinner /> : (
                  <>
                    <ShieldAlert size={16} /> Konfirmasi Manual (Backdoor)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </StaffLayout>
  );
}
