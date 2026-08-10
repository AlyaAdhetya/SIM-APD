import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import StaffProfil from './pages/StaffProfil';

import HcDashboard from './pages/hc/Dashboard';
import ImportMahasiswa from './pages/hc/ImportMahasiswa';
import DataMahasiswa from './pages/hc/DataMahasiswa';
import KelolaApd from './pages/hc/KelolaApd';
import PeminjamanPengembalian from './pages/hc/PeminjamanPengembalian';
import VerifikasiPeminjamanDetail from './pages/hc/VerifikasiPeminjamanDetail';
import PermintaanApdHc from './pages/hc/PermintaanApd';
import RiwayatEkspor from './pages/hc/RiwayatEkspor';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ganti-password" element={<ChangePassword />} />

          {/* HC */}
          <Route path="/hc" element={<ProtectedRoute allowedRoles={['hc']}><HcDashboard /></ProtectedRoute>} />
          <Route path="/hc/import-mahasiswa" element={<ProtectedRoute allowedRoles={['hc']}><ImportMahasiswa /></ProtectedRoute>} />
          <Route path="/hc/data-mahasiswa" element={<ProtectedRoute allowedRoles={['hc']}><DataMahasiswa /></ProtectedRoute>} />
          <Route path="/hc/kelola-apd" element={<ProtectedRoute allowedRoles={['hc']}><KelolaApd /></ProtectedRoute>} />
          <Route path="/hc/peminjaman-pengembalian" element={<ProtectedRoute allowedRoles={['hc']}><PeminjamanPengembalian /></ProtectedRoute>} />
          <Route path="/hc/verifikasi-peminjaman/:id" element={<ProtectedRoute allowedRoles={['hc']}><VerifikasiPeminjamanDetail /></ProtectedRoute>} />
          <Route path="/hc/permintaan-apd" element={<ProtectedRoute allowedRoles={['hc']}><PermintaanApdHc /></ProtectedRoute>} />
          <Route path="/hc/riwayat-ekspor" element={<ProtectedRoute allowedRoles={['hc']}><RiwayatEkspor /></ProtectedRoute>} />
          
          {/* Umum untuk Staff */}
          <Route path="/staff/profil" element={<ProtectedRoute><StaffProfil /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
