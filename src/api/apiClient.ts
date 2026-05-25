import axios from 'axios';
import { useStore } from '../store/useStore';

// Base URL for the Spring Boot backend
const BASE_URL = import.meta.env.VITE_API_URL || 'https://sms-backend-02eg.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling (like 401s)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized. Clearing token and redirecting to login...');
      sessionStorage.removeItem('token');
      useStore.setState({ isAuthenticated: false });
    }
    return Promise.reject(error);
  }
);
