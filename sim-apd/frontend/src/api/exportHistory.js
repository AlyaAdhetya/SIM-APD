import client from './client';

export const saveExportHistory = (data) =>
  client.post('/api/export-history/save', data).then((r) => r.data);

export const listExportHistory = () =>
  client.get('/api/export-history/list').then((r) => r.data);

export const getExportData = (id) =>
  client.get(`/api/export-history/${id}/data`).then((r) => r.data);

export const deleteExportHistory = (id) =>
  client.delete(`/api/export-history/${id}`).then((r) => r.data);
