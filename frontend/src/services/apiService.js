import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('%c API Config:', 'background: #222; color: #bada55', { 
  baseUrl: API_BASE_URL, 
  envValue: process.env.REACT_APP_API_URL,
  timestamp: new Date().toLocaleTimeString()
});

// Create an axios instance with default config
const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add authorization header
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const timestamp = new Date().toLocaleTimeString();
    
    console.log('%c API Request:', 'color: blue', {
      url: `${config.baseURL}${config.url}`,
      method: config.method.toUpperCase(),
      timestamp: timestamp,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('%c Request Error:', 'color: red', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiService.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log('%c API Response:', 'color: green', {
      url: response.config.url,
      status: response.status,
      timestamp: timestamp,
      data: response.data
    });
    return response;
  },
  (error) => {
    const timestamp = new Date().toLocaleTimeString();
    console.error('%c API Error:', 'background: red; color: white', {
      url: error.config?.url,
      timestamp: timestamp,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn'
      });
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status === 500) {
      console.error('%c Server error:', 'background: red; color: white', error.response.data);
      return Promise.reject({
        success: false,
        message: 'Lỗi máy chủ, vui lòng thử lại sau'
      });
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('%c Network error:', 'background: red; color: white', 'Không thể kết nối đến máy chủ');
      return Promise.reject({
        success: false,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã được khởi động.'
      });
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default apiService;