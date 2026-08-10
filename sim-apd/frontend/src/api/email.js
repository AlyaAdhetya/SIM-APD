import client from './client';

export const sendRestockEmail = (to, items, catatan) =>
  client.post('/api/email/send-restock', { to, items, catatan }).then(r => r.data);
