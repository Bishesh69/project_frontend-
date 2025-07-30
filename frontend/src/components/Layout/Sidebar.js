import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Brain,
  BarChart3,
  User,
  Sparkles,
  Trophy,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and stats',
    },
    {
      name: 'Take Quiz',
      href: '/quiz',
      icon: Brain,
      description: 'Start adaptive quiz',
    },
    {
      name: 'AI Generate',
      href: '/ai-generate',
      icon: Sparkles,
      description: 'Generate questions',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Performance insights',
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
      description: 'Compare with others',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage account',
    },
  ];

  // Add admin navigation if user is admin
  if (user?.role === 'admin') {
    navigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: Settings,
      description: 'System management',
    });
  }

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 flex flex-col">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Navigation
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`group relative flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 mr-3 transition-colors ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}
              />
              
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </div>
              </div>

              {/* Hover effect */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/10 to-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {user?.stats?.totalQuizzes || 0}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Quizzes</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {user?.stats?.averageScore || 0}%
            </div>
            <div className="text-gray-500 dark:text-gray-400">Avg Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;