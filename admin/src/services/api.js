import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://project-backend-5f4r.onrender.com/api',
  timeout: 30000,
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin Auth API
export const adminAuthAPI = {
  login: (credentials) => API.post('/admin/login', credentials),
  getMe: () => API.get('/admin/me'),
  logout: () => {
    localStorage.removeItem('adminToken');
    return Promise.resolve();
  },
};

// Admin User Management API
export const adminUserAPI = {
  getAllUsers: (params) => API.get('/admin/users', { params }),
  getUserById: (id) => API.get(`/admin/users/${id}`),
  updateUser: (id, userData) => API.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  banUser: (id) => API.put(`/admin/users/${id}/ban`),
  unbanUser: (id) => API.put(`/admin/users/${id}/unban`),
};

// Admin Quiz Management API
export const adminQuizAPI = {
  getAllQuizzes: (params) => API.get('/admin/quizzes', { params }),
  getQuizById: (id) => API.get(`/admin/quizzes/${id}`),
  createQuiz: (quizData) => API.post('/admin/quizzes', quizData),
  updateQuiz: (id, quizData) => API.put(`/admin/quizzes/${id}`, quizData),
  deleteQuiz: (id) => API.delete(`/admin/quizzes/${id}`),
  publishQuiz: (id) => API.put(`/admin/quizzes/${id}/publish`),
  unpublishQuiz: (id) => API.put(`/admin/quizzes/${id}/unpublish`),
};

// Admin Analytics API
export const adminAnalyticsAPI = {
  getDashboardStats: () => API.get('/admin/analytics/dashboard'),
  getUserStats: (params) => API.get('/admin/analytics/users', { params }),
  getQuizStats: (params) => API.get('/admin/analytics/quizzes', { params }),
  getSystemStats: () => API.get('/admin/analytics/system'),
};

export default API;