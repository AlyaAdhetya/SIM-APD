import client from './client';

export const createPermintaan = (items, catatan) =>
  client.post('/api/permintaan/create', { items, catatan }).then((r) => r.data);

export const listPermintaan = (status) =>
  client
    .get('/api/permintaan/list', { params: status ? { status } : {} })
    .then((r) => r.data);

export const approvePermintaan = (id) =>
  client.post('/api/permintaan/approve', { id }).then((r) => r.data);

export const rejectPermintaan = (id, alasan) =>
  client.post('/api/permintaan/reject', { id, alasan }).then((r) => r.data);
