import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Search,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

const NotFound = () => {
  const suggestions = [
    {
      title: 'Go to Dashboard',
      description: 'Return to your main dashboard',
      icon: Home,
      link: '/dashboard',
      color: 'primary',
    },
    {
      title: 'Take a Quiz',
      description: 'Start practicing with a quiz',
      icon: Search,
      link: '/quiz',
      color: 'success',
    },
    {
      title: 'View Analytics',
      description: 'Check your performance stats',
      icon: HelpCircle,
      link: '/analytics',
      color: 'warning',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Page Not Found - AdaptiveExam</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-8xl md:text-9xl font-bold text-primary-200 dark:text-primary-800 select-none"
              >
                404
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-warning-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Don't worry, let's get you back on track!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              to="/"
              className="btn-primary flex items-center justify-center"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Or try one of these:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <motion.div
                    key={suggestion.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <Link
                      to={suggestion.link}
                      className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 group"
                    >
                      <div className={`w-12 h-12 bg-${suggestion.color}-100 dark:bg-${suggestion.color}-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 text-${suggestion.color}-600 dark:text-${suggestion.color}-400`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {suggestion.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {suggestion.description}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Still need help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@adaptiveexam.com"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Contact Support
              </a>
              <span className="hidden sm:inline text-gray-400">•</span>
              <Link
                to="/help"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Help Center
              </Link>
            </div>
          </motion.div>

          {/* Fun Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <div className="flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-primary-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default NotFound;