import api from './api';

export const employeeService = {
  async getEmployees(params = {}) {
    const res = await api.get('/employees', { params });
    return res.data;
  },

  async getEmployeeById(id) {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  async createEmployee(data) {
    const res = await api.post('/employees', data);
    return res.data;
  },

  async updateEmployee(id, data) {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },

  async updateStatus(id, isActive) {
    const res = await api.patch(`/employees/${id}/status`, { isActive });
    return res.data;
  },

  async resetPassword(id, newPassword) {
    const res = await api.post(`/employees/${id}/reset-password`, { newPassword });
    return res.data;
  },

  async deleteEmployee(id) {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  }
};

export default employeeService;
