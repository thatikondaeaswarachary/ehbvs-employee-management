import api from './api';

export const workReportService = {
  async submitReport(data) {
    const res = await api.post('/work-reports', data);
    return res.data;
  },

  async getMyReports(params = {}) {
    const res = await api.get('/work-reports/my', { params });
    return res.data;
  },

  async getAllReports(params = {}) {
    const res = await api.get('/work-reports', { params });
    return res.data;
  },

  async getReportById(id) {
    const res = await api.get(`/work-reports/${id}`);
    return res.data;
  }
};

export default workReportService;
