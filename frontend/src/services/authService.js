import api from './api';

export const authService = {
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async heartbeat(workStatus) {
    const res = await api.post('/auth/heartbeat', { workStatus });
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    return res.data;
  }
};

export default authService;
