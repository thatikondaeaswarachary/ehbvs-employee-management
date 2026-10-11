import axios from 'axios';

const LIVE_BACKEND_URL = 'https://daa2-2409-40f0-4401-83e8-fc4c-fdd5-f944-fda1.ngrok-free.app/api';

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // When running on Firebase Hosting production domains, route directly to the active live server
  if (typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'))) {
    return LIVE_BACKEND_URL;
  }
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

api.interceptors.request.use(
  (config) => {
    config.headers['ngrok-skip-browser-warning'] = 'true';
    const token = localStorage.getItem('ehbvs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        localStorage.removeItem('ehbvs_token');
        localStorage.removeItem('ehbvs_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
