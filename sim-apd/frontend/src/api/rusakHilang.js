import client from './client';

export const listRusakHilang = (filters = {}) =>
  client.get('/api/rusak_hilang/list', { params: filters }).then((r) => r.data);

export const updateStatusRusakHilang = (id, status_penanganan, catatan_hsse) =>
  client
    .post('/api/rusak_hilang/update_status', { id, status_penanganan, catatan_hsse })
    .then((r) => r.data);
