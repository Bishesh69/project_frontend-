import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  Palette,
  Save,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Shield,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { isValidEmail, isStrongPassword } from '../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, updatePassword, deleteAccount } = useAuth();
  const { theme, toggleTheme, setLightTheme, setDarkTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    weeklyReport: user?.preferences?.weeklyReport ?? true,
    language: user?.preferences?.language || 'en',
    timezone: user?.preferences?.timezone || 'UTC',
    difficulty: user?.preferences?.difficulty || 'medium',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
      });
      setPreferences({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        pushNotifications: user.preferences?.pushNotifications ?? true,
        weeklyReport: user.preferences?.weeklyReport ?? true,
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        difficulty: user.preferences?.difficulty || 'medium',
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Shield },
  ];

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (profileData.website && !profileData.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!isStrongPassword(passwordData.newPassword)) {
      errors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await updateProfile({ preferences });
      toast.success('Preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = async () => {
    try {
      // This would typically call an API endpoint to export user data
      toast.success('Data export initiated. You will receive an email with your data.');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const renderProfileTab = () => (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile Picture
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a new profile picture
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">
            Full Name
          </label>
          <input
            type="text"
            className={`input ${profileErrors.name ? 'border-error-500' : ''}`}
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />
          {profileErrors.name && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {profileErrors.name}
            </p>
          )}
        </div>
        
        <div>
          <label className="label">
            Email Address
          </label>
          <input
            type="email"
            className={`input ${profileErrors.email ? 'border-error-500' : ''}`}
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          />
          {profileErrors.email && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {profileErrors.email}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <label className="label">
          Bio
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="Tell us about yourself..."
          value={profileData.bio}
          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">
            Location
          </label>
          <input
            type="text"
            className="input"
            placeholder="City, Country"
            value={profileData.location}
            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
          />
        </div>
        
        <div>
          <label className="label">
            Website
          </label>
          <input
            type="url"
            className={`input ${profileErrors.website ? 'border-error-500' : ''}`}
            placeholder="https://yourwebsite.com"
            value={profileData.website}
            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
          />
          {profileErrors.website && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {profileErrors.website}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderSecurityTab = () => (
    <div className="space-y-8">
      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Change Password
        </h3>
        
        <div>
          <label className="label">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              className={`input pr-10 ${passwordErrors.currentPassword ? 'border-error-500' : ''}`}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
            >
              {showPasswords.current ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {passwordErrors.currentPassword && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {passwordErrors.currentPassword}
            </p>
          )}
        </div>
        
        <div>
          <label className="label">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              className={`input pr-10 ${passwordErrors.newPassword ? 'border-error-500' : ''}`}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            >
              {showPasswords.new ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {passwordErrors.newPassword && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {passwordErrors.newPassword}
            </p>
          )}
        </div>
        
        <div>
          <label className="label">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              className={`input pr-10 ${passwordErrors.confirmPassword ? 'border-error-500' : ''}`}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {passwordErrors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPreferencesTab = () => (
    <form onSubmit={handlePreferencesSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Email Notifications
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive quiz results and updates via email
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={preferences.emailNotifications}
              onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Push Notifications
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified about new quizzes and achievements
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={preferences.pushNotifications}
              onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Weekly Report
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive weekly progress summaries
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={preferences.weeklyReport}
              onChange={(e) => setPreferences({ ...preferences, weeklyReport: e.target.checked })}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Learning Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">
              Default Difficulty
            </label>
            <select
              className="input"
              value={preferences.difficulty}
              onChange={(e) => setPreferences({ ...preferences, difficulty: e.target.value })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="label">
              Language
            </label>
            <select
              className="input"
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Theme Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={setLightTheme}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'light'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="w-full h-20 bg-white rounded border mb-3"></div>
          <p className="font-medium text-gray-900 dark:text-white">Light</p>
        </button>
        
        <button
          onClick={setDarkTheme}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'dark'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="w-full h-20 bg-gray-800 rounded border mb-3"></div>
          <p className="font-medium text-gray-900 dark:text-white">Dark</p>
        </button>
        
        <button
          onClick={toggleTheme}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'system'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 rounded border mb-3"></div>
          <p className="font-medium text-gray-900 dark:text-white">System</p>
        </button>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Export
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Download a copy of all your data including quiz results, preferences, and profile information.
        </p>
        <button
          onClick={handleExportData}
          className="btn-outline flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export My Data
        </button>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Profile - AdaptiveExam</title>
        <meta name="description" content="Manage your profile, security settings, and preferences." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="card p-6">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'preferences' && renderPreferencesTab()}
              {activeTab === 'appearance' && renderAppearanceTab()}
              {activeTab === 'data' && renderDataTab()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex-1 flex items-center justify-center"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Profile;