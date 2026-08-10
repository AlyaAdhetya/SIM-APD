import client from './client';

export const getNotifications = () => {
  return client.get('/api/dashboard/notifications').then((r) => r.data);
};

export const markNotificationRead = (id) => {
  return client.put(`/api/dashboard/notifications/${id}/read`).then((r) => r.data);
};
