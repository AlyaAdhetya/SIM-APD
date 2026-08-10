import client from './client';


export const listPeminjaman = (params) =>
  client
    .get('/api/peminjaman/list', { params: params || {} })
    .then((r) => r.data);

export const detailPeminjaman = (id) =>
  client.get('/api/peminjaman/detail', { params: { id } }).then((r) => r.data);

export const approvePeminjaman = (id) =>
  client.post('/api/peminjaman/approve', { id }).then((r) => r.data);

export const deletePeminjaman = (id) =>
  client.delete(`/api/peminjaman/delete/${id}`).then((r) => r.data);

export const finishPeminjaman = (id) =>
  client.put(`/api/peminjaman/finish/${id}`).then((r) => r.data);

export const sendReminderPeminjaman = (id) =>
  client.post(`/api/peminjaman/${id}/send-reminder`).then((r) => r.data);
