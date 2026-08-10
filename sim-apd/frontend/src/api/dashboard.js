import client from './client';

export const getHcSummary       = () => client.get('/api/dashboard/hc_summary').then(r => r.data.data);
export const getStokApd         = () => client.get('/api/dashboard/stok_apd').then(r => r.data.data);
