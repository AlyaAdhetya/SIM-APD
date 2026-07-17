import client from './client';

export const listDivisi = () =>
  client.get('/api/divisi/list').then((r) => r.data);

export const saveDivisi = (data) =>
  client.post('/api/divisi/save', data).then((r) => r.data);

export const deleteDivisi = (id) =>
  client.post('/api/divisi/save', { id, action: 'delete' }).then((r) => r.data);
