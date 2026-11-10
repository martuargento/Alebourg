import axios from 'axios';

const apiRootUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const API_BASE_URL = `${apiRootUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('admin_token')) {
      localStorage.removeItem('admin_token');
      window.dispatchEvent(new Event('alebourg:auth-expired'));
    }
    return Promise.reject(error);
  },
);



export default api;
