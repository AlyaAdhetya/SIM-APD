import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CheckCircle, AlertCircle, ShoppingBag, Send, RefreshCw, HardHat, Glasses, Shirt, HandMetal, Footprints, Shield, ChevronDown, Loader2 } from 'lucide-react';
import './App.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

function App() {
  // Form State
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [divisi, setDivisi] = useState('');
  const [universitas, setUniversitas] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [nimValidated, setNimValidated] = useState(false);
  
  const [apdOptions, setApdOptions] = useState([]);
  const [selectedApds, setSelectedApds] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);
  const [isApdLoading, setIsApdLoading] = useState(true);

  const getApdIcon = (namaApd) => {
    const name = namaApd.toLowerCase();
    if (name.includes('helm')) return <HardHat size={20} />;
    if (name.includes('kacamata')) return <Glasses size={20} />;
    if (name.includes('rompi')) return <Shirt size={20} />;
    if (name.includes('sarung tangan')) return <HandMetal size={20} />;
    if (name.includes('sepatu')) return <Footprints size={20} />;
    return <Shield size={20} />;
  };

  useEffect(() => {
    setIsApdLoading(true);
    axios.get(`${API_URL}/public/apd-stok`)
      .then(res => {
        const data = res.data.data || [];
        
        const allowedOptions = {
          'Helm Safety': ['All Size (Adjustable)'],
          'Kacamata Safety': ['Standar'],
          'Wearpack': ['S', 'M', 'L', 'XL', 'XXL'],
          'Sepatu Safety': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
        };

        const filteredData = data.filter(item => {
          if (allowedOptions[item.nama_apd]) {
            return allowedOptions[item.nama_apd].includes(item.ukuran);
          }
          return false;
        });
        
        setApdOptions(filteredData);
      })
      .catch(err => console.error('Gagal mengambil data stok:', err))
      .finally(() => setIsApdLoading(false));
  }, []);

  const handleCheckNim = async () => {
    if (!nim) {
      return; // Do not show error if empty, just return
    }
    
    setLoading(true);
    setError('');
    setBlocked(false);
    setNimValidated(false);
    setNama('');
    setDivisi('');

    try {
      const res = await axios.get(`${API_URL}/public/check-nim/${nim}`);
      const data = res.data.data.mahasiswa;
      
      setNama(data.nama);
      setDivisi(data.divisi || 'Umum');
      if (data.universitas) setUniversitas(data.universitas);
      if (data.tgl_mulai) setTglMulai(data.tgl_mulai);
      if (data.tgl_selesai) setTglSelesai(data.tgl_selesai);

      if (!data.wajib_apd) {
        setBlocked(true);
        setError(`Halo ${data.nama}, Divisi Anda (${data.divisi}) tidak diwajibkan menggunakan APD. Anda tidak perlu mengisi form ini.`);
      } else if (data.status !== 'aktif') {
        setBlocked(true);
        setError(`Halo ${data.nama}, status magang Anda saat ini sudah selesai atau tidak aktif. Anda tidak dapat mengajukan form ini.`);
      } else if (data.has_peminjaman) {
        setBlocked(true);
        setError(`Halo ${data.nama}, Anda sudah memiliki pengajuan peminjaman aktif dengan status: ${data.peminjaman_status.replace('_', ' ')}.`);
      } else {
        setNimValidated(true);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal mencari data. Pastikan NIM benar dan koneksi stabil.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlurNim = () => {
    if (nim && !nimValidated) {
      handleCheckNim();
    }
  };

  const handleKeyDownNim = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nim && !nimValidated) {
        handleCheckNim();
      }
    }
  };

  const handleSelectApd = (stokId, namaApd) => {
    if (!nimValidated) {
      setError('Silakan validasi NIM Anda terlebih dahulu.');
      return;
    }
    // Dapatkan semua stok_id dalam kategori yang sama
    const categoryIds = apdOptions
      .filter(item => item.nama_apd === namaApd)
      .map(item => item.stok_id);
    setSelectedApds(prev => {
      // Hapus semua pilihan lama dalam kategori ini, lalu tambahkan yang baru
      const withoutCategory = prev.filter(id => !categoryIds.includes(id));
      // Jika klik item yang sudah dipilih, batalkan pilihan (toggle off)
      if (prev.includes(stokId)) return withoutCategory;
      return [...withoutCategory, stokId];
    });
  };

  const toggleCategory = (namaApd) => {
    setExpandedCategories(prev => ({
      ...prev,
      [namaApd]: !prev[namaApd]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nimValidated) {
      setError('Silakan validasi NIM Anda terlebih dahulu sebelum submit.');
      return;
    }

    if (!email) {
      setError('Silakan isi alamat Email / Gmail Anda.');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Demi kelancaran sistem notifikasi, harap gunakan alamat email Google (@gmail.com).');
      return;
    }

    if (!universitas || !tglMulai || !tglSelesai) {
      setError('Silakan lengkapi data Universitas, Tanggal Mulai, dan Tanggal Selesai.');
      return;
    }

    if (selectedApds.length === 0) {
      setError('Pilih minimal satu APD yang ingin dipinjam.');
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        email: email,
        nim: nim,
        universitas: universitas,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        apd_items: selectedApds.map(id => ({ stok_id: id, jumlah: 1 }))
      };
      
      const res = await axios.post(`${API_URL}/public/submit-form`, payload);
      setSuccessCode(res.data.data.kode_referensi);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal mengirim form. Silakan coba lagi.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successCode) {
    const handleDownloadBukti = async () => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');
        
        const cardElement = document.getElementById('success-card-pdf');
        if (!cardElement) return;

        // Hide buttons for PDF
        const buttonsContainer = document.getElementById('success-buttons-container');
        if (buttonsContainer) buttonsContainer.style.display = 'none';

        const canvas = await html2canvas(cardElement, {
          scale: 2,
          backgroundColor: '#0f172a'
        });

        // Restore buttons
        if (buttonsContainer) buttonsContainer.style.display = 'flex';

        const imgData = canvas.toDataURL('image/png');
        
        // Gunakan ukuran custom yang jauh lebih kecil (misal seukuran tiket/kartu nama besar)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [110, 70] // 11 cm x 7 cm
        });

        const finalPdfWidth = pdf.internal.pageSize.getWidth();
        const finalPdfHeight = (canvas.height * finalPdfWidth) / canvas.width;

        // Center vertically if needed, but mostly it'll fit nicely
        pdf.addImage(imgData, 'PNG', 0, 0, finalPdfWidth, finalPdfHeight);
        pdf.save(`Bukti_Pengajuan_${successCode}.pdf`);
      } catch (error) {
        console.error('Gagal membuat PDF:', error);
        alert('Gagal membuat file PDF. Silakan coba lagi.');
      }
    };

    return (
      <div className="gform-container">
        <div id="success-card-pdf" className="gform-header-card success-card" style={{ padding: '48px', background: '#0f172a' }}>
          <div className="gform-top-accent"></div>
          <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h1 className="text-center" style={{ color: '#fff' }}>Pengajuan Berhasil!</h1>
          <p className="text-center" style={{ color: '#94a3b8' }}>Terima kasih <strong>{nama}</strong>, form Anda telah tersimpan di sistem.</p>
          
          <div className="ref-box" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <span className="ref-label" style={{ color: '#94a3b8' }}>KODE REFERENSI</span>
            <span className="ref-code" style={{ color: '#fbbf24' }}>{successCode}</span>
          </div>
          
          <p className="text-center" style={{ color: '#94a3b8', marginBottom: '8px' }}>
            Silakan tunjukkan kode referensi ini kepada staff HC untuk mengambil APD Anda.
          </p>
          <p className="text-center" style={{ color: '#38bdf8', fontSize: '14px', marginBottom: '24px' }}>
            Keterangan: Kode referensi di atas juga telah dikirimkan ke email yang Anda masukkan ({email}).
          </p>
          
          <div id="success-buttons-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '32px' }}>
            <button className="btn-modern" style={{ background: '#334155', color: 'white', border: 'none' }} onClick={handleDownloadBukti}>
              Unduh Bukti Pengajuan (PDF)
            </button>
            <button className="btn-modern btn-modern-primary" onClick={() => window.location.reload()}>
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isApdLoading) {
    return (
      <div className="gform-container">
        <div className="gform-header-card fade-in">
          <div className="skeleton skeleton-title" style={{ width: '60%', height: 32, marginBottom: 16 }} />
          <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 60, borderRadius: 8 }} />
        </div>

        <div className="form-section fade-in" style={{ animationDelay: '0.1s', marginTop: 24 }}>
          <div className="input-container" style={{ padding: 24 }}>
            <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 50, borderRadius: 12 }} />
          </div>
          <div className="input-container" style={{ padding: '0 24px 24px' }}>
            <div className="skeleton skeleton-text" style={{ width: '25%', marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 50, borderRadius: 12 }} />
          </div>
          <div className="input-container" style={{ padding: '0 24px 24px' }}>
            <div className="skeleton skeleton-text" style={{ width: '25%', marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 50, borderRadius: 12 }} />
          </div>
        </div>

        <div style={{ marginTop: '40px', animationDelay: '0.2s' }} className="fade-in">
          <div className="skeleton skeleton-title" style={{ width: '40%', marginBottom: 12 }} />
          <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: 24 }} />
          <div className="skeleton-loader-container" style={{ display: 'flex', flexDirection: 'column' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton skeleton-accordion-item" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gform-container">
      <div className="gform-header-card fade-in">
        <h1>Formulir Peminjaman APD</h1>
        <p style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>Sistem Informasi Manajemen APD - PT Pertamina RU III</p>
        <div className="info-box">
          Formulir ini digunakan untuk merekam data peminjaman Alat Pelindung Diri (APD) bagi mahasiswa magang yang ditempatkan di divisi wajib APD.
        </div>
      </div>

      {error && (
        <div className={`gform-card alert fade-in ${blocked ? 'alert-warning' : 'alert-error'}`}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          {/* Email */}
          <div className="input-container fade-in">
            <label className="gform-label">
              Alamat Email (Gmail) <span className="required">*</span>
            </label>
            <input 
              type="email" 
              className="gform-input" 
              placeholder="contoh@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              name="random_email_field"
            />
          </div>

          {/* NIM */}
          <div className={`input-container fade-in ${nimValidated ? 'validated-card' : ''}`}>
            <label className="gform-label">
              Nomor Induk Mahasiswa (NIM) <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input 
                type="text" 
                className="gform-input" 
                placeholder="" 
                value={nim}
                onChange={(e) => {
                  setNim(e.target.value);
                  setNimValidated(false);
                  setNama('');
                  setDivisi('');
                }}
                onBlur={handleBlurNim}
                onKeyDown={handleKeyDownNim}
                readOnly={nimValidated || loading}
                required
              />
              {loading && (
                <div className="btn-modern validated-badge" style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  <Loader2 size={16} className="spinner" /> Mengecek...
                </div>
              )}
              {nimValidated && (
                <div className="btn-modern validated-badge" style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 16px' }}>
                  <CheckCircle size={16} /> Terverifikasi
                </div>
              )}
            </div>
            <div className="gform-hint">Tekan <strong>Enter</strong> atau berpindah kolom untuk memverifikasi NIM otomatis.</div>
          </div>

          {/* Nama */}
          <div className={`input-container fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
            <label className="gform-label">
              Nama Lengkap <span className="required">*</span>
            </label>
            <input 
              type="text" 
              className="gform-input" 
              placeholder="Otomatis terisi setelah NIM diverifikasi" 
              value={nama}
              readOnly
              disabled={!nimValidated}
            />
          </div>

          {/* Divisi */}
          <div className={`input-container fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
            <label className="gform-label">
              Divisi Penempatan <span className="required">*</span>
            </label>
            <input 
              type="text" 
              className="gform-input" 
              placeholder="Otomatis terisi setelah NIM diverifikasi" 
              value={divisi}
              readOnly
              disabled={!nimValidated}
            />
          </div>

          {/* Universitas */}
          <div className={`input-container fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
            <label className="gform-label">
              Universitas <span className="required">*</span>
            </label>
            <input 
              type="text" 
              className="gform-input" 
              placeholder="Masukkan asal universitas" 
              value={universitas}
              onChange={(e) => setUniversitas(e.target.value)}
              disabled={!nimValidated}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Tanggal Mulai */}
            <div className={`input-container fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
              <label className="gform-label">
                Tanggal Mulai Magang <span className="required">*</span>
              </label>
              <input 
                type="date" 
                className="gform-input" 
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
                disabled={!nimValidated}
                required
              />
            </div>

            {/* Tanggal Selesai */}
            <div className={`input-container fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
              <label className="gform-label">
                Tanggal Selesai Magang <span className="required">*</span>
              </label>
              <input 
                type="date" 
                className="gform-input" 
                value={tglSelesai}
                onChange={(e) => setTglSelesai(e.target.value)}
                disabled={!nimValidated}
                required
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px' }} className={`fade-in ${!nimValidated ? 'disabled-card' : ''}`}>
          <div className="apd-section-title">
            Pilih APD yang Akan Dipinjam <span className="required">*</span>
          </div>
          <div className="apd-section-subtitle">Pilih satu ukuran per jenis APD sesuai kebutuhan pekerjaan Anda.</div>
          
          {apdOptions.length === 0 ? (
            <div className="alert alert-warning fade-in">
              <AlertCircle size={18} /> Data stok APD kosong atau belum ditambahkan oleh Admin HC.
            </div>
          ) : (
            (() => {
              const groupedApds = apdOptions.reduce((acc, apd) => {
                if (!acc[apd.nama_apd]) acc[apd.nama_apd] = [];
                acc[apd.nama_apd].push(apd);
                return acc;
              }, {});

              return (
                <div className="gform-checkbox-group">
                  {Object.keys(groupedApds).map(namaApd => {
                    const sizes = groupedApds[namaApd];
                    const isExpanded = expandedCategories[namaApd];
                    const hasSelection = sizes.some(s => selectedApds.includes(s.stok_id));

                    return (
                      <div key={namaApd} className={`gform-accordion-item ${hasSelection ? 'has-selection' : ''}`}>
                        <div 
                          className="gform-accordion-header" 
                          onClick={() => toggleCategory(namaApd)}
                        >
                          <div className="apd-icon">
                            {getApdIcon(namaApd)}
                          </div>
                          <span className="apd-name">
                            {namaApd} 
                            {hasSelection && <CheckCircle size={16} color="var(--success-color)" style={{marginLeft: '8px', display: 'inline-flex', verticalAlign: 'text-bottom'}}/>}
                          </span>
                          <ChevronDown className={`accordion-icon ${isExpanded ? 'expanded' : ''}`} size={20} />
                        </div>
                        
                        {isExpanded && (
                          <div className="gform-accordion-body fade-in">
                            {sizes.map(s => (
                              <label 
                                key={s.stok_id} 
                                className={`gform-checkbox-label ${selectedApds.includes(s.stok_id) ? 'selected' : ''}`}
                              >
                                <input 
                                  type="radio"
                                  name={`apd-${namaApd}`}
                                  checked={selectedApds.includes(s.stok_id)}
                                  onChange={() => handleSelectApd(s.stok_id, namaApd)}
                                  disabled={!nimValidated}
                                />
                                <div className="checkbox-content" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                  <span className="apd-size" style={{ fontSize: '15px' }}>Ukuran: {s.ukuran}</span>
                                  <span className="text-muted" style={{fontSize: '12px'}}>(Stok: {s.total_stok})</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>

        <div className="gform-footer fade-in">
          <button 
            type="button"
            className="btn-modern btn-modern-danger" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={18} />
            Kosongkan Formulir
          </button>
          <button 
            type="submit" 
            className="btn-modern btn-modern-primary" 
            disabled={!nimValidated || selectedApds.length === 0 || submitLoading}
          >
            <Send size={18} />
            {submitLoading ? 'Mengirim...' : 'Kirim Formulir'}
          </button>
        </div>
        <div className="text-center fade-in" style={{ marginTop: '24px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary-color)' }}>* Wajib diisi untuk memproses pengajuan peminjaman.</span>
        </div>
      </form>
    </div>
  );
}

export default App;
