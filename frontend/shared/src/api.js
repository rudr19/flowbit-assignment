import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
const getAuthToken = () => {
  return localStorage.getItem('token');
};
const handleAuthFailure = () => {
  localStorage.removeItem('token');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      handleAuthFailure();
    } else if (error.response?.status === 403) {
      console.log('Forbidden - insufficient permissions');
    } else if (error.response?.status === 500) {
      console.log('Server error - please try again later');
    } else if (error.code === 'ECONNABORTED') {
      console.log('Request timeout');
    } else if (!error.response) {
      console.log('Network error - check your connection');
    }

    return Promise.reject(error);
  }
);
export const apiHelpers = {
  isAuthenticated: () => {
    return !!getAuthToken();
  },
  getToken: () => {
    return getAuthToken();
  },
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  clearToken: () => {
    localStorage.removeItem('token');
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

export { api };