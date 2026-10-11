import api from './api';

export const taskService = {
  async getTasks(params = {}) {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  async getMyTasks(params = {}) {
    const res = await api.get('/tasks/my', { params });
    return res.data;
  },

  async getTaskById(id) {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  async createTask(data) {
    const res = await api.post('/tasks', data);
    return res.data;
  },

  async updateTask(id, data) {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },

  async updateTaskStatus(id, data) {
    const res = await api.patch(`/tasks/${id}/status`, data);
    return res.data;
  },

  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  }
};

export default taskService;
