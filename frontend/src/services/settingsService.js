import api from './api';

export const settingsService = {
  async getSettings() {
    const res = await api.get('/settings');
    return res.data;
  },

  async updateSettings(data) {
    const res = await api.put('/settings', data);
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await api.get('/settings/audit-logs', { params });
    return res.data;
  }
};

export default settingsService;
