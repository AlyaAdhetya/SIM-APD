import client from './client';

/**
 * items: [{ peminjaman_detail_id, kondisi, catatan }]
 * fotos: [File|null, ...] sesuai urutan items
 */
export const createPengembalian = (peminjamanId, items, fotos) => {
  const formData = new FormData();
  formData.append('peminjaman_id', peminjamanId);
  formData.append('items', JSON.stringify(items));
  fotos.forEach((file, idx) => {
    if (file) formData.append(`foto_${items[idx].peminjaman_detail_id}`, file);
  });
  return client
    .post('/api/pengembalian/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const listPengembalian = (status) =>
  client
    .get('/api/pengembalian/list', { params: status ? { status } : {} })
    .then((r) => r.data);

export const getPengembalianByQr = (token) =>
  client.get('/api/pengembalian/by_qr', { params: { token } }).then((r) => r.data);

export const approvePengembalian = (id) =>
  client.post('/api/pengembalian/approve', { id }).then((r) => r.data);

export const deletePengembalian = (id) =>
  client.delete(`/api/pengembalian/delete/${id}`).then((r) => r.data);

export const confirmScanPengembalian = (token) =>
  client.post('/api/pengembalian/confirm-scan', { token }).then((r) => r.data);
