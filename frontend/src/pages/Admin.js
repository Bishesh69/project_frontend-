import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { adminAPI } from '../services/api';
import { formatDate, formatDuration, calculatePercentage } from '../utils/helpers';
import toast from 'react-hot-toast';

const Admin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Users data
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // all, active, inactive, admin
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'AdaptiveExam',
    allowRegistration: true,
    requireEmailVerification: true,
    maxQuizAttempts: 3,
    defaultQuizTimeLimit: 30,
    maintenanceMode: false,
    enableNotifications: true,
  });
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          const dashData = await adminAPI.getDashboard();
          setDashboardData(dashData);
          break;
        case 'users':
          const usersData = await adminAPI.getUsers();
          setUsers(usersData);
          break;
        case 'analytics':
          const analyticsData = await adminAPI.getAnalytics();
          setAnalytics(analyticsData);
          break;
        case 'settings':
          const settingsData = await adminAPI.getSettings();
          setSystemSettings(settingsData);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      switch (action) {
        case 'activate':
          await adminAPI.activateUser(userId);
          toast.success('User activated successfully');
          break;
        case 'deactivate':
          await adminAPI.deactivateUser(userId);
          toast.success('User deactivated successfully');
          break;
        case 'makeAdmin':
          await adminAPI.makeAdmin(userId);
          toast.success('User promoted to admin');
          break;
        case 'removeAdmin':
          await adminAPI.removeAdmin(userId);
          toast.success('Admin privileges removed');
          break;
        case 'update':
          await adminAPI.updateUser(userId, data);
          toast.success('User updated successfully');
          setShowUserModal(false);
          setEditingUser(null);
          break;
        case 'delete':
          await adminAPI.deleteUser(userId);
          toast.success('User deleted successfully');
          setShowDeleteConfirm(false);
          setUserToDelete(null);
          break;
        default:
          break;
      }
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }
    
    try {
      await adminAPI.bulkUserAction(action, selectedUsers);
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedUsers([]);
      fetchData();
    } catch (error) {
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      await adminAPI.updateSettings(systemSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleExportData = async (type) => {
    try {
      await adminAPI.exportData(type);
      toast.success(`${type} data export initiated`);
    } catch (error) {
      toast.error(`Failed to export ${type} data`);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userFilters = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'admin', label: 'Admins' },
  ];

  const filteredUsers = users.filter((userData) => {
    const matchesSearch = userData.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         userData.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesFilter = userFilter === 'all' ||
                         (userFilter === 'active' && userData.isActive) ||
                         (userFilter === 'inactive' && !userData.isActive) ||
                         (userFilter === 'admin' && userData.role === 'admin');
    
    return matchesSearch && matchesFilter;
  });

  const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${
              change >= 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={dashboardData?.totalUsers || 0}
          change={dashboardData?.userGrowth}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Active Users"
          value={dashboardData?.activeUsers || 0}
          change={dashboardData?.activeUserGrowth}
          icon={Activity}
          color="success"
        />
        <StatCard
          title="Total Quizzes"
          value={dashboardData?.totalQuizzes || 0}
          change={dashboardData?.quizGrowth}
          icon={BarChart3}
          color="warning"
        />
        <StatCard
          title="System Health"
          value={dashboardData?.systemHealth || '100%'}
          icon={Shield}
          color="purple"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent User Activity
          </h3>
          <div className="space-y-4">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'login' ? 'bg-success-500' :
                  activity.type === 'quiz' ? 'bg-primary-500' :
                  activity.type === 'register' ? 'bg-warning-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            {dashboardData?.systemStatus?.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {status.status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-success-500" />
                  ) : status.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-warning-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-error-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {status.service}
                  </span>
                </div>
                <span className={`text-sm ${
                  status.status === 'healthy' ? 'text-success-600' :
                  status.status === 'warning' ? 'text-warning-600' : 'text-error-600'
                }`}>
                  {status.message}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="input w-auto"
          >
            {userFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedUsers.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn-outline text-sm"
              >
                Activate Selected
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn-outline text-sm"
              >
                Deactivate Selected
              </button>
            </>
          )}
          <button
            onClick={() => handleExportData('users')}
            className="btn-outline flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(userData.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, userData.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== userData.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        {userData.avatar ? (
                          <img src={userData.avatar} alt={userData.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {userData.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userData.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userData.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.isActive
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                    }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {userData.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(userData.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {userData.lastActiveAt ? formatDate(userData.lastActiveAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(userData);
                          setShowUserModal(true);
                        }}
                        className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(
                          userData.isActive ? 'deactivate' : 'activate',
                          userData.id
                        )}
                        className={`p-1 rounded ${
                          userData.isActive
                            ? 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                            : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                        }`}
                        title={userData.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {userData.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(userData);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Analytics content would go here */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed analytics dashboard coming soon...
        </p>
      </motion.div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          System Settings
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">
                Site Name
              </label>
              <input
                type="text"
                className="input"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
              />
            </div>
            
            <div>
              <label className="label">
                Default Quiz Time Limit (minutes)
              </label>
              <input
                type="number"
                className="input"
                value={systemSettings.defaultQuizTimeLimit}
                onChange={(e) => setSystemSettings({ ...systemSettings, defaultQuizTimeLimit: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow User Registration
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow new users to register accounts
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={systemSettings.allowRegistration}
                onChange={(e) => setSystemSettings({ ...systemSettings, allowRegistration: e.target.checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Require Email Verification
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Require users to verify their email addresses
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={systemSettings.requireEmailVerification}
                onChange={(e) => setSystemSettings({ ...systemSettings, requireEmailVerification: e.target.checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Maintenance Mode
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Put the site in maintenance mode
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Notifications
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable system notifications
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={systemSettings.enableNotifications}
                onChange={(e) => setSystemSettings({ ...systemSettings, enableNotifications: e.target.checked })}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSettingsUpdate}
              className="btn-primary flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel - AdaptiveExam</title>
        <meta name="description" content="Administrative dashboard for managing users and system settings." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, view analytics, and configure system settings
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-outline flex items-center mt-4 sm:mt-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* User Edit Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit User
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction('update', editingUser.id, editingUser)}
                className="btn-primary flex-1"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete {userToDelete.name}? This action cannot be undone.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUserAction('delete', userToDelete.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex-1"
                >
                  Delete User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Admin;