import client from './client';

export const getHcSummary       = () => client.get('/api/dashboard/hc_summary').then(r => r.data.data);
export const getHsseSummary     = () => client.get('/api/dashboard/hsse_summary').then(r => r.data.data);
export const getStatusPeminjaman = () => client.get('/api/report/status_peminjaman').then(r => r.data.data);
export const getPenggunaanApd   = () => client.get('/api/report/penggunaan_apd').then(r => r.data.data);
export const getKepatuhanApd    = () => client.get('/api/report/kepatuhan_apd').then(r => r.data.data);
