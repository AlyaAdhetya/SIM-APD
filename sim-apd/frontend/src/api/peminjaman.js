import client from './client';

/**
 * items: [{ apd_stok_id }]
 * fotos: [File, File, ...] sesuai urutan items
 */
export const createPeminjaman = (tglRencanaKembali, items, fotos) => {
  const formData = new FormData();
  formData.append('tgl_rencana_kembali', tglRencanaKembali || '');
  formData.append('items', JSON.stringify(items));
  fotos.forEach((file, idx) => {
    if (file) formData.append(`foto_${items[idx].apd_stok_id}`, file);
  });
  return client
    .post('/api/peminjaman/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const listPeminjaman = (status) =>
  client
    .get('/api/peminjaman/list', { params: status ? { status } : {} })
    .then((r) => r.data);

export const detailPeminjaman = (id) =>
  client.get('/api/peminjaman/detail', { params: { id } }).then((r) => r.data);

export const approvePeminjaman = (id) =>
  client.post('/api/peminjaman/approve', { id }).then((r) => r.data);

export const rejectPeminjaman = (id, alasan) =>
  client.post('/api/peminjaman/reject', { id, alasan }).then((r) => r.data);

export const deletePeminjaman = (id) =>
  client.delete(`/api/peminjaman/delete/${id}`).then((r) => r.data);
