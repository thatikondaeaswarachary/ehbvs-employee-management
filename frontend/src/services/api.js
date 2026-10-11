import axios from 'axios';

// Default 24/7 Render Cloud Backend URL (can also be set via VITE_API_BASE_URL or localStorage)
export const DEFAULT_CLOUD_API_URL = 'https://ehbvs-employee-backend.onrender.com/api';

export function getApiBaseUrl() {
  // 1. Check if user configured a custom backend URL in localStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('ehbvs_backend_url');
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim().replace(/\/$/, '');
    }
  }

  // 2. Check if build-time environment variable is present
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  // 3. When deployed on Firebase Hosting or external domains, route to the 24/7 cloud backend
  if (typeof window !== 'undefined' && (
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com') ||
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  )) {
    return DEFAULT_CLOUD_API_URL;
  }

  // 4. Default to /api for local development (proxied by Vite to localhost:5000)
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 45000, // 45 seconds timeout for smooth cold boot handling
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    // Dynamically ensure base URL is current
    config.baseURL = getApiBaseUrl();
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
  async (error) => {
    const originalRequest = error.config;

    // Auto-retry once after 3 seconds on cold-boot or network glitch (502, 503, 504, or network error)
    if (originalRequest && !originalRequest._retry && (!error.response || [502, 503, 504].includes(error.response?.status))) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 3000));
      return api(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest?._authCleared) {
      originalRequest._authCleared = true;
      // Clear token if expired or unauthorized
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        localStorage.removeItem('ehbvs_token');
        localStorage.removeItem('ehbvs_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
