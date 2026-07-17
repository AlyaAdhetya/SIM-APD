import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import StaffProfil from './pages/StaffProfil';

import MahasiswaDashboard from './pages/mahasiswa/Dashboard';
import AjukanPeminjaman from './pages/mahasiswa/AjukanPeminjaman';
import DetailPeminjaman from './pages/mahasiswa/DetailPeminjaman';
import AjukanPengembalian from './pages/mahasiswa/AjukanPengembalian';
import ScanPengembalian from './pages/mahasiswa/ScanPengembalian';
import RiwayatPeminjaman from './pages/mahasiswa/RiwayatPeminjaman';
import Profil from './pages/mahasiswa/Profil';

import HcDashboard from './pages/hc/Dashboard';
import ImportMahasiswa from './pages/hc/ImportMahasiswa';
import DataMahasiswa from './pages/hc/DataMahasiswa';
import KelolaApd from './pages/hc/KelolaApd';
import PeminjamanPengembalian from './pages/hc/PeminjamanPengembalian';
import VerifikasiPeminjamanDetail from './pages/hc/VerifikasiPeminjamanDetail';
import PermintaanApdHc from './pages/hc/PermintaanApd';
import RiwayatPermintaanHc from './pages/hc/RiwayatPermintaan';
import KelolaDivisiApd from './pages/hc/KelolaDivisiApd';

import HsseDashboard from './pages/hsse/Dashboard';
import MonitoringRusakHilang from './pages/hsse/MonitoringRusakHilang';
import PermintaanApdHsse from './pages/hsse/PermintaanApd';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ganti-password" element={<ChangePassword />} />

          {/* Mahasiswa */}
          <Route path="/m" element={<ProtectedRoute allowedUserType="mahasiswa"><MahasiswaDashboard /></ProtectedRoute>} />
          <Route path="/m/peminjaman" element={<ProtectedRoute allowedUserType="mahasiswa"><AjukanPeminjaman /></ProtectedRoute>} />
          <Route path="/m/peminjaman/:id" element={<ProtectedRoute allowedUserType="mahasiswa"><DetailPeminjaman /></ProtectedRoute>} />
          <Route path="/m/pengembalian/:id" element={<ProtectedRoute allowedUserType="mahasiswa"><AjukanPengembalian /></ProtectedRoute>} />
          <Route path="/m/scan-pengembalian" element={<ProtectedRoute allowedUserType="mahasiswa"><ScanPengembalian /></ProtectedRoute>} />
          <Route path="/m/riwayat" element={<ProtectedRoute allowedUserType="mahasiswa"><RiwayatPeminjaman /></ProtectedRoute>} />
          <Route path="/m/profil" element={<ProtectedRoute allowedUserType="mahasiswa"><Profil /></ProtectedRoute>} />

          {/* HC */}
          <Route path="/hc" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><HcDashboard /></ProtectedRoute>} />
          <Route path="/hc/import-mahasiswa" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><ImportMahasiswa /></ProtectedRoute>} />
          <Route path="/hc/data-mahasiswa" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><DataMahasiswa /></ProtectedRoute>} />
          <Route path="/hc/kelola-apd" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><KelolaApd /></ProtectedRoute>} />
          <Route path="/hc/peminjaman-pengembalian" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><PeminjamanPengembalian /></ProtectedRoute>} />
          <Route path="/hc/verifikasi-peminjaman/:id" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><VerifikasiPeminjamanDetail /></ProtectedRoute>} />
          <Route path="/hc/permintaan-apd" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><PermintaanApdHc /></ProtectedRoute>} />
          <Route path="/hc/riwayat-permintaan" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><RiwayatPermintaanHc /></ProtectedRoute>} />
          <Route path="/hc/kelola-divisi" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hc']}><KelolaDivisiApd /></ProtectedRoute>} />

          {/* Umum untuk Staff */}
          <Route path="/staff/profil" element={<ProtectedRoute allowedUserType="staff"><StaffProfil /></ProtectedRoute>} />

          {/* HSSE */}
          <Route path="/hsse" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hsse']}><HsseDashboard /></ProtectedRoute>} />
          <Route path="/hsse/rusak-hilang" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hsse']}><MonitoringRusakHilang /></ProtectedRoute>} />
          <Route path="/hsse/permintaan-apd" element={<ProtectedRoute allowedUserType="staff" allowedRoles={['hsse']}><PermintaanApdHsse /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
