import api from './api';

export const attendanceService = {
  async checkIn() {
    const res = await api.post('/attendance/check-in');
    return res.data;
  },

  async checkOut() {
    const res = await api.post('/attendance/check-out');
    return res.data;
  },

  async updateWorkStatus(status) {
    const res = await api.patch('/attendance/status', { status });
    return res.data;
  },

  async getMyAttendance(params = {}) {
    const res = await api.get('/attendance/my', { params });
    return res.data;
  },

  async getAllAttendance(params = {}) {
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  async getEmployeeAttendance(employeeId, params = {}) {
    const res = await api.get(`/attendance/${employeeId}`, { params });
    return res.data;
  },

  async updateAttendanceRecord(id, data) {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },

  async adminMarkAttendance(data) {
    const res = await api.post('/attendance/admin-mark', data);
    return res.data;
  }
};

export default attendanceService;
