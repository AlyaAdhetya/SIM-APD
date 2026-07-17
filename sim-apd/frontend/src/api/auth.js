import client from './client';

export const login = (identifier, password) => 
  client.post('/api/auth/login', { identifier, password }).then((r) => r.data);

export const getMe = () => client.get('/api/auth/me').then((r) => r.data);

export const changePassword = (old_password, new_password) =>
  client.post('/api/auth/change_password', { old_password, new_password }).then((r) => r.data);

export const logout = () => client.post('/api/auth/logout').then((r) => r.data);

export const updateProfile = (data) =>
  client.put('/api/auth/update_profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
