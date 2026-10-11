import api from './api';

export const leaveService = {
  async applyLeave(data) {
    const res = await api.post('/leave', data);
    return res.data;
  },

  async getMyLeaves() {
    const res = await api.get('/leave/my');
    return res.data;
  },

  async getAllLeaves(params = {}) {
    const res = await api.get('/leave', { params });
    return res.data;
  },

  async approveLeave(id, adminRemarks = '') {
    const res = await api.patch(`/leave/${id}/approve`, { adminRemarks });
    return res.data;
  },

  async rejectLeave(id, adminRemarks = '') {
    const res = await api.patch(`/leave/${id}/reject`, { adminRemarks });
    return res.data;
  }
};

export default leaveService;
