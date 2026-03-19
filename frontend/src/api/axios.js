import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is likely invalid or expired
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      // Optional: window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;
