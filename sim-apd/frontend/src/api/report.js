import client from './client';

// HC – status peminjaman APD
export const getStatusPeminjaman = (year, month) =>
  client.get(`/api/report/hc/status_peminjaman?year=${year}&month=${month}`).then(r => r.data);

export const exportStatusPeminjaman = (year, month, format) =>
  client.get(`/api/report/hc/status_peminjaman_export?year=${year}&month=${month}&format=${format}`, { responseType: 'blob' })
    .then(r => r.data);

// HC – penggunaan APD
export const getPenggunaanApd = (year, month) =>
  client.get(`/api/report/hc/penggunaan_apd?year=${year}&month=${month}`).then(r => r.data);

export const exportPenggunaanApd = (year, month, format) =>
  client.get(`/api/report/hc/penggunaan_apd_export?year=${year}&month=${month}&format=${format}`, { responseType: 'blob' })
    .then(r => r.data);

// HSSE – kepatuhan APD
export const getKepatuhanApd = (year, month) =>
  client.get(`/api/report/hsse/kepatuhan_apd?year=${year}&month=${month}`).then(r => r.data);

export const exportKepatuhanApd = (year, month, format) =>
  client.get(`/api/report/hsse/kepatuhan_apd_export?year=${year}&month=${month}&format=${format}`, { responseType: 'blob' })
    .then(r => r.data);
