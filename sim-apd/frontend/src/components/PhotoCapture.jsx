import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

export default function PhotoCapture({ label, onChange, required }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  const [preview, setPreview] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  function handleFile(e) {
    setShowMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function reset(e) {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  return (
    <div className="field">
      <label>
        {label} {required && <span style={{ color: 'var(--red-600)' }}>*</span>}
      </label>

      {/* Tampilan Preview Foto */}
      {preview ? (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt={label} className="photo-thumb" />
          <button
            type="button"
            className="btn btn-sm btn-danger"
            style={{ position: 'absolute', top: 8, right: 8 }}
            onClick={reset}
          >
            Hapus
          </button>
        </div>
      ) : (
        /* Container Upload */
        <div 
          onClick={() => setShowMenu(true)}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-color)',
            transition: 'all 0.2s'
          }}
          className="hover-scale"
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', margin: '0 auto 12px' }}>
            <Camera size={24} />
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-800)', marginBottom: 4 }}>Ketuk untuk Ambil Foto</h4>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: 0 }}>Pilih Kamera atau Galeri</p>
        </div>
      )}

      {/* Pop-up Menu Pilihan (Action Sheet) */}
      {showMenu && !preview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setShowMenu(false)}>
          <div style={{
            background: 'white', width: '100%', maxWidth: 480,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: '24px 20px', animation: 'slideUp 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--slate-800)' }}>Pilih Sumber Foto</h3>
              <button className="icon-btn" onClick={() => setShowMenu(false)}><X size={20} /></button>
            </div>
            
            <button 
              className="btn btn-accent btn-block" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12, padding: '16px' }}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={20} /> Buka Kamera Langsung
            </button>
            
            <button 
              className="btn btn-outline btn-block" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px' }}
              onClick={() => galleryInputRef.current?.click()}
            >
              <ImageIcon size={20} /> Pilih dari Galeri / File
            </button>
          </div>
        </div>
      )}

      {/* Input File Tersembunyi */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}
