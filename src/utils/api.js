import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: inject JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sbt_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: refresh access token on expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the failure is JWT related and we haven't already retried
    if (error.response && error.response.status === 403 && !originalRequest._retry) {
      // Check if it's a force password change - do not retry in that case
      if (error.response.data && error.response.data.must_change_password) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('sbt_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;
          
          localStorage.setItem('sbt_access_token', accessToken);
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid - log out user
          localStorage.removeItem('sbt_access_token');
          localStorage.removeItem('sbt_refresh_token');
          localStorage.removeItem('sbt_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
