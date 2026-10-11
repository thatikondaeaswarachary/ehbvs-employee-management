import api from './api';

export const reportService = {
  async getDashboardMetrics() {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },

  async getAttendanceReport(params = {}) {
    const res = await api.get('/reports/attendance', { params });
    return res.data;
  },

  async getWorkHoursReport(params = {}) {
    const res = await api.get('/reports/work-hours', { params });
    return res.data;
  },

  async getTaskReport(params = {}) {
    const res = await api.get('/reports/tasks', { params });
    return res.data;
  },

  async getLeaveReport(params = {}) {
    const res = await api.get('/reports/leave', { params });
    return res.data;
  },

  async getEmployeeSummaryReport(params = {}) {
    const res = await api.get('/reports/employees', { params });
    return res.data;
  },

  async downloadCsv(type) {
    const res = await api.get(`/reports/export/${type}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EHBVS_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default reportService;
