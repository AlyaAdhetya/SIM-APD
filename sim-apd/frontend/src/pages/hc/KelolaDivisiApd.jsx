import { useEffect, useState } from 'react';
import { Info, Plus, CheckCircle, XCircle, Edit2, Trash2, Building, ShieldCheck, ShieldOff, Search } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import { LoadingPage, ButtonSpinner } from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import { listDivisi, saveDivisi, deleteDivisi } from '../../api/divisi';
import { apiErrorMessage } from '../../api/client';

export default function KelolaDivisiApd() {
  const [list, setList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form tambah / edit
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = tambah baru
  const [formNama, setFormNama] = useState('');
  const [formWajib, setFormWajib] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Konfirmasi hapus
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, nama_divisi }
  const [deleting, setDeleting] = useState(false);

  function load() {
    listDivisi()
      .then((res) => setList(res.data))
      .catch(() => setError('Gagal memuat daftar divisi.'));
  }

  useEffect(() => { load(); }, []);

  function openTambah() {
    setEditItem(null);
    setFormNama('');
    setFormWajib(true);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setFormNama(item.nama_divisi);
    setFormWajib(!!item.wajib_apd);
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setFormNama('');
    setFormError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formNama.trim()) { setFormError('Nama divisi tidak boleh kosong.'); return; }
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const payload = {
        nama_divisi: formNama.trim(),
        wajib_apd: formWajib ? 1 : 0,
        ...(editItem ? { id: editItem.id } : {}),
      };
      const res = await saveDivisi(payload);
      setSuccess(res.message || 'Divisi berhasil disimpan.');
      closeForm();
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Gagal menyimpan divisi.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setSuccess('');
    try {
      const res = await deleteDivisi(confirmDelete.id);
      setSuccess(res.message || 'Divisi berhasil dihapus.');
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus divisi.'));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <StaffLayout
      title="Kelola Divisi Wajib APD"
      subtitle="Atur divisi mana yang wajib menggunakan APD selama magang"
    >
      {/* Info banner */}
      <div className="alert alert-info" style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.6 }}>
        <Info size={22} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          Pengaturan ini menentukan status <strong>wajib APD</strong> mahasiswa saat import data CSV.
          Perubahan di sini <strong>tidak</strong> mengubah data mahasiswa yang sudah terdaftar secara otomatis —
          silakan ubah manual jika diperlukan di halaman <strong>Data Mahasiswa</strong>.
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CheckCircle size={18} /> {success}</div>}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            placeholder="Cari divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: 40 }}
          />
        </div>
        <button className="btn btn-accent" onClick={openTambah} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={18} /> Tambah Divisi
        </button>
      </div>

      {/* Daftar divisi */}
      {!list && !error && <LoadingPage />}
      {list && list.length === 0 && (
        <EmptyState icon={<Building size={48} style={{ color: 'var(--slate-300)' }} />} title="Belum ada data divisi" />
      )}

      {list && list.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Nama Divisi</th>
                  <th style={{ width: '30%', textAlign: 'center' }}>Wajib APD</th>
                  <th style={{ width: '40%', textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', marginRight: 70 }}>Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.filter(item => item.nama_divisi.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                      Tidak ada divisi yang cocok dengan pencarian "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  list.filter(item => item.nama_divisi.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.nama_divisi}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {item.wajib_apd ? (
                          <span className="badge badge-success" style={{ width: 125, whiteSpace: 'nowrap', display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'center', gap: 6 }}><CheckCircle size={15} /> Wajib</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ width: 125, whiteSpace: 'nowrap', display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'center', gap: 6 }}><XCircle size={15} /> Tidak Wajib</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDelete(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: 'var(--navy-900)', marginBottom: 16 }}>
              {editItem ? <Edit2 size={20} /> : <Plus size={20} />}
              {editItem ? 'Edit Divisi' : 'Tambah Divisi Baru'}
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="nama-divisi">Nama Divisi</label>
                <input
                  id="nama-divisi"
                  className="input"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Process Control"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Status APD</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      name="wajib"
                      checked={formWajib === true}
                      onChange={() => setFormWajib(true)}
                    />
                    <ShieldCheck size={16} /> Wajib APD
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      name="wajib"
                      checked={formWajib === false}
                      onChange={() => setFormWajib(false)}
                    />
                    <ShieldOff size={16} /> Tidak Wajib APD
                  </label>
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  {formWajib
                    ? 'Mahasiswa dari divisi ini akan diwajibkan meminjam APD.'
                    : 'Mahasiswa dari divisi ini tidak perlu meminjam APD dan akan mendapat notifikasi saat input NIM.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeForm} disabled={saving}>
                  Batal
                </button>
                <button className="btn btn-accent" style={{ flex: 2 }} disabled={saving}>
                  {saving ? <ButtonSpinner /> : (editItem ? 'Simpan Perubahan' : 'Tambah Divisi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmDelete && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, color: 'var(--red-600)', marginBottom: 12 }}>
              <Trash2 size={20} /> Hapus Divisi
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--gray-700)', marginBottom: 20 }}>
              Yakin ingin menghapus divisi <strong>"{confirmDelete.nama_divisi}"</strong>?
              Mahasiswa yang sudah terdaftar dengan divisi ini tidak akan terpengaruh.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 2 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <ButtonSpinner /> : 'Ya, Hapus'}
              </button>
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
  maxWidth: 440, width: '100%',
  boxShadow: '0 8px 30px rgba(11,36,54,0.18)',
};
