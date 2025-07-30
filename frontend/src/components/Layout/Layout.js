import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <Header onToggleSidebar={toggleSidebar} />

      <div className="flex">
        {/* Sidebar - only show for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={closeSidebar}
                  />

                  {/* Mobile Sidebar */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
                  >
                    <Sidebar onClose={closeSidebar} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isAuthenticated ? 'lg:ml-64' : ''
          }`}
        >
          <div className="pt-16"> {/* Account for fixed header */}
            <div className="min-h-[calc(100vh-4rem)]">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;