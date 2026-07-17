import client from './client';

export const listApd = (activeOnly = false) =>
  client
    .get('/api/apd/list', { params: activeOnly ? { active_only: '1' } : {} })
    .then((r) => r.data);

export const createJenisApd = (payload) =>
  client.post('/api/apd/jenis_create', payload).then((r) => r.data);

export const createStokApd = (payload) =>
  client.post('/api/apd/stok_create', payload).then((r) => r.data);

export const updateStokApd = (payload) =>
  client.post('/api/apd/stok_update', payload).then((r) => r.data);

export const nonaktifkanStokApd = (id) =>
  client.post('/api/apd/nonaktifkan', { id }).then((r) => r.data);
