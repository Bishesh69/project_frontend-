import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me'),
  forgotPassword: (email) => API.post('/auth/forgot-password', email),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  updatePassword: (data) => API.put('/auth/update-password', data),
};

// User API
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (userData) => API.put('/users/profile', userData),
  updatePreferences: (preferences) => API.put('/users/preferences', preferences),
  getDashboard: () => API.get('/users/dashboard'),
  getLeaderboard: (params) => API.get('/users/leaderboard', { params }),
  deleteAccount: (password) => API.delete('/users/account', { data: { password } }),
  getUsers: (params) => API.get('/users', { params }), // Admin only
};

// Quiz API
export const quizAPI = {
  startAdaptiveQuiz: (data) => API.post('/quizzes/adaptive/start', data),
  submitAnswer: (data) => API.post('/quizzes/adaptive/answer', data),
  getResults: (params) => API.get('/quizzes/results', { params }),
  getResultById: (id) => API.get(`/quizzes/results/${id}`),
  getStats: () => API.get('/quizzes/stats'),
  getSubjects: () => API.get('/quizzes/subjects'),
};

// AI API
export const aiAPI = {
  generateFromText: (data) => API.post('/ai/generate-from-text', data),
  generateFromFile: (formData) => API.post('/ai/generate-from-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  extractText: (formData) => API.post('/ai/extract-text', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getHistory: (params) => API.get('/ai/history', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  updateUserRole: (userId, role) => API.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  getQuestions: (params) => API.get('/admin/questions', { params }),
  createQuestion: (questionData) => API.post('/admin/questions', questionData),
  updateQuestion: (questionId, questionData) => API.put(`/admin/questions/${questionId}`, questionData),
  deleteQuestion: (questionId) => API.delete(`/admin/questions/${questionId}`),
  getAnalytics: (params) => API.get('/admin/analytics', { params }),
};

export default API;