import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileSpreadsheet, FileText } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import { ButtonSpinner } from '../../components/Loading';
import { importMahasiswa } from '../../api/mahasiswa';
import { apiErrorMessage } from '../../api/client';

const SAMPLE_CSV =
  'no,nama,nim,universitas,tgl_mulai,tgl_akhir,tempat_pkl\n' +
  '1,Budi Santoso,2024001,Universitas Indonesia,2026-07-01,2026-09-30,Divisi HC\n' +
  '2,Siti Rahayu,2024002,Universitas Gadjah Mada,2026-07-01,2026-09-30,Divisi IT\n';

const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.pdf';

export default function ImportMahasiswa() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await importMahasiswa(file);
      setResult(res.data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengimpor data mahasiswa.'));
    } finally {
      setLoading(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contoh_import_mahasiswa.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <StaffLayout title="Import Data Mahasiswa" subtitle="Akun mahasiswa akan dibuat otomatis (password awal = NIM)">
      <div className="card">
        <div className="card-title">Unggah File (CSV / Excel / PDF)</div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>
          Format kolom yang diperlukan:
        </p>
        <div style={{
          background: 'var(--gray-50, #f9fafb)',
          border: '1px solid var(--gray-200, #e5e7eb)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 13,
          marginBottom: 14,
          fontFamily: 'monospace',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          <strong>no</strong> | <strong>nama</strong> | <strong>nim</strong> | <strong>universitas</strong> | <strong>tgl_mulai</strong> | <strong>tgl_akhir</strong> | <strong>tempat_pkl</strong>
        </div>
        <p style={{ fontSize: 12, color: 'var(--gray-400, #9ca3af)', marginBottom: 14 }}>
          Baris pertama dianggap sebagai header dan akan dilewati. Format tanggal: <code>YYYY-MM-DD</code>.
          Kolom <code>tempat_pkl</code> digunakan untuk menentukan status wajib APD secara otomatis.
          Format file yang diterima: <strong>CSV</strong>, <strong>Excel (.xlsx/.xls)</strong>, <strong>PDF</strong> (berbasis teks).
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {result && (
          <div className="alert alert-success">
            Berhasil menambahkan {result.jumlah_berhasil} mahasiswa.
            {result.jumlah_dilewati > 0 && ` ${result.jumlah_dilewati} baris dilewati.`}
          </div>
        )}
        {result?.detail_dilewati?.length > 0 && (
          <div className="alert alert-info">
            Dilewati: {result.detail_dilewati.join(', ')}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div 
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 16,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#f8fafc',
              transition: 'all 0.2s ease',
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_TYPES}
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            
            {file ? (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green-600)', marginBottom: 16 }}>
                  {file.name.endsWith('.csv') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx') ? <FileSpreadsheet size={28} /> : <FileText size={28} />}
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{file.name}</p>
                <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>{(file.size / 1024).toFixed(1)} KB — Klik untuk mengganti file</p>
              </div>
            ) : (
              <div>
                <UploadCloud size={48} style={{ color: 'var(--slate-400)', marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>Pilih file untuk diunggah</p>
                <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>Atau seret dan lepas file Anda ke area ini</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" disabled={!file || loading}>
              {loading ? <ButtonSpinner /> : 'Import Data'}
            </button>
            <button type="button" className="btn btn-outline" onClick={downloadSample}>
              Unduh Contoh CSV
            </button>
            <Link to="/hc/data-mahasiswa" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Daftar Mahasiswa
            </Link>
          </div>
        </form>
      </div>
    </StaffLayout>
  );
}
