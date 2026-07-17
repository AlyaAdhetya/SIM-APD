import axios from 'axios';

/**
 * Sesuaikan BASE_URL ini dengan lokasi folder backend Anda di htdocs XAMPP/Laragon.
 * Contoh default: project diletakkan di htdocs/sim-apd, sehingga backend dapat
 * diakses di http://localhost/sim-apd/backend
 */
export const HOST_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BASE_URL = HOST_URL;

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${HOST_URL}${path}`;
  return `${HOST_URL}/uploads/${path}`;
}

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('simapd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // 401 = token tidak valid/expired, 403 = user type tidak sesuai (misal token staff dipakai di endpoint mahasiswa)
    if (status === 401 || status === 403) {
      const msg = error.response?.data?.message || '';
      // Hanya clear & redirect jika benar-benar masalah autentikasi (bukan error bisnis lainnya)
      if (status === 401 || msg.includes('tidak memiliki akses ke fitur ini')) {
        localStorage.removeItem('simapd_token');
        localStorage.removeItem('simapd_user_type');
        localStorage.removeItem('simapd_role');
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper untuk mengambil pesan error dari response API secara konsisten.
 */
export function apiErrorMessage(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  return error?.response?.data?.message || fallback;
}

export default client;
