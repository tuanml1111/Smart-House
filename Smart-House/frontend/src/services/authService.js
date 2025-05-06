import apiService from './apiService';

const authService = {
  // Login user
  async login(username, password) {
    console.log('%c LOGIN ATTEMPT', 'background: #222; color: #bada55', { username, targetUrl: `${apiService.defaults.baseURL}/auth/login` });
    
    try {
      // Log request before it's sent
      console.log('%c Sending login request...', 'color: blue');
      
      // Add timeout tracking
      const startTime = new Date().getTime();
      
      const response = await apiService.post('/auth/login', { username, password });
      
      // Log response timing
      const endTime = new Date().getTime();
      console.log(`%c Response received in ${endTime - startTime}ms`, 'color: green');
      console.log('%c Login response:', 'color: green', response);
      
      if (response.data.success) {
        // Save token to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        
        console.log('%c Login successful!', 'background: green; color: white');
        return response.data;
      } else {
        console.error('%c Login failed:', 'background: red; color: white', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Đăng nhập thất bại'
        };
      }
    } catch (error) {
      const errorTime = new Date().toLocaleTimeString();
      console.error(`%c Login error at ${errorTime}:`, 'background: red; color: white', error);
      
      // Detailed logging for network errors
      console.error('%c Error details:', 'color: red', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        isNetworkError: !error.response,
        time: errorTime
      });
      
      // Kiểm tra chi tiết lỗi kết nối
      if (!error.response) {
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã được khởi động.'
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi kết nối đến server'
      };
    }
  },
  
  // Logout user
  async logout() {
    try {
      // In a real application, we would call the API to invalidate the token
      // For demo purposes, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return { success: true };
    } catch (error) {
      console.error('Logout service error:', error);
      throw error;
    }
  },
  
  // Check if token is valid
  async validateToken() {
    try {
      // In a real application, we would verify the token with the server
      // For demo purposes, we'll assume any token in localStorage is valid
      const token = localStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
};

export default authService;