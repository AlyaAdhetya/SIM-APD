import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import { LoadingPage } from '../../components/Loading';
import { detailPeminjaman, finishPeminjaman, sendReminderPeminjaman, approvePeminjaman } from '../../api/peminjaman';
import { CheckCircle, PackageCheck, Mail, CheckSquare } from 'lucide-react';
import { apiErrorMessage } from '../../api/client';
import { ButtonSpinner } from '../../components/Loading';

export default function VerifikasiPeminjamanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  function load() {
    detailPeminjaman(id)
      .then((res) => setData(res.data))
      .catch(() => setError('Gagal memuat detail peminjaman.'));
  }
  useEffect(() => { load(); }, [id]);

  const [sendingReminder, setSendingReminder] = useState(false);

  async function handleFinish() {
    setProcessing(true);
    try {
      await finishPeminjaman(id);
      setConfirmOpen(false);
      setToast({ message: 'Peminjaman berhasil diselesaikan dan stok dikembalikan.', type: 'success' });
      load();
    } catch (err) {
      setToast({ message: apiErrorMessage(err, 'Gagal menyelesaikan peminjaman.'), type: 'error' });
      setConfirmOpen(false);
    } finally {
      setProcessing(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      await approvePeminjaman(id);
      setConfirmApproveOpen(false);
      setToast({ message: 'Pengambilan APD berhasil dikonfirmasi. Status menjadi Aktif.', type: 'success' });
      load();
    } catch (err) {
      setToast({ message: apiErrorMessage(err, 'Gagal mengonfirmasi pengambilan.'), type: 'error' });
      setConfirmApproveOpen(false);
    } finally {
      setApproving(false);
    }
  }

  async function handleSendReminder() {
    setSendingReminder(true);
    setConfirmEmailOpen(false);
    try {
      await sendReminderPeminjaman(id);
      setToast({ message: 'Email pengingat berhasil dikirim ke mahasiswa.', type: 'success' });
    } catch (err) {
      setToast({ message: apiErrorMessage(err, 'Gagal mengirim email pengingat.'), type: 'error' });
    } finally {
      setSendingReminder(false);
    }
  }

  const maskEmail = (email) => {
    if (!email) return 'Tidak ada email';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 3 ? name.substring(0, 3) + '*'.repeat(name.length - 3) : name + '*';
    return `${maskedName}@${domain}`;
  };

  if (!data && !error) return <StaffLayout title="Detail Peminjaman"><LoadingPage /></StaffLayout>;

  return (
    <StaffLayout title="Detail Peminjaman" subtitle={data?.kode_referensi}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <ConfirmModal
        isOpen={confirmOpen}
        title="Tandai Selesai"
        message="Anda yakin ingin menandai peminjaman ini sebagai selesai? Stok APD terkait akan otomatis dikembalikan ke dalam sistem."
        confirmText="Ya, Selesaikan"
        variant="success"
        isLoading={processing}
        onConfirm={handleFinish}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmApproveOpen}
        title="Konfirmasi Pengambilan"
        message="Apakah mahasiswa terkait sudah mengambil APD secara fisik? Tindakan ini akan mengubah status menjadi Aktif dan memotong stok inventori secara otomatis."
        confirmText="Ya, Konfirmasi Pengambilan"
        variant="primary"
        isLoading={approving}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApproveOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmEmailOpen}
        title="Kirim Email Pengingat"
        message={`Email pengingat akan dikirimkan secara otomatis ke alamat email mahasiswa berikut: ${data?.email ? maskEmail(data.email) : 'Email tidak ditemukan'}. Apakah Anda yakin ingin melanjutkan?`}
        confirmText="Ya, Kirim Email"
        variant="primary"
        isLoading={sendingReminder}
        onConfirm={handleSendReminder}
        onCancel={() => setConfirmEmailOpen(false)}
      />

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, letterSpacing: '-0.01em' }}>{data.nama_mahasiswa}</div>
                <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>
                  NIM {data.nim} · {data.divisi}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, textAlign: 'right' }}>
                {(data.universitas || data.tgl_mulai) && (
                  <div>
                    {data.universitas && <div style={{ fontSize: 16, fontWeight: '700', color: 'var(--slate-800)' }}>{data.universitas}</div>}
                    {data.tgl_mulai && data.tgl_selesai && (
                      <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 2 }}>
                        Magang: {new Date(data.tgl_mulai).toLocaleDateString('id-ID')} - {new Date(data.tgl_selesai).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                )}
                <StatusBadge status={data.status} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Daftar APD yang Dipinjam</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--slate-50)', borderRadius: 12, border: '1px solid var(--slate-200)' }}>
                  <CheckCircle size={24} color="var(--primary-color)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--slate-800)', marginBottom: 2 }}>{it.nama_apd}</div>
                    <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>Ukuran {it.ukuran}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/hc/peminjaman-pengembalian')}>
              Kembali ke Daftar
            </button>
            {data.status === 'menunggu_verifikasi' && (
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
                onClick={() => setConfirmApproveOpen(true)}
              >
                <CheckSquare size={18} /> Konfirmasi Pengambilan
              </button>
            )}
            {data.status === 'disetujui' && (
              <>
                <button 
                  className="btn btn-warning" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', background: '#ea580c', borderColor: '#ea580c' }} 
                  onClick={() => setConfirmEmailOpen(true)}
                  disabled={sendingReminder}
                >
                  {sendingReminder ? <ButtonSpinner /> : <><Mail size={18} /> Kirim Pengingat</>}
                </button>
                <button 
                  className="btn btn-success" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
                  onClick={() => setConfirmOpen(true)}
                >
                  <PackageCheck size={18} /> Tandai Selesai
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
