import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  Brain,
  TrendingUp,
  Award,
  Clock,
  Target,
  Plus,
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  Calendar,
  Trophy,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import { formatDate, formatPercentage, getScoreColor } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, recentResponse] = await Promise.all([
          quizAPI.getStats(),
          quizAPI.getRecentQuizzes(5)
        ]);
        
        setStats(statsResponse.data);
        setRecentQuizzes(recentResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Take Quiz',
      description: 'Start a new quiz session',
      icon: BookOpen,
      link: '/quiz',
      color: 'bg-primary-500',
      hoverColor: 'hover:bg-primary-600',
    },
    {
      title: 'AI Generate',
      description: 'Create questions with AI',
      icon: Brain,
      link: '/ai-generate',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      title: 'View Analytics',
      description: 'Track your progress',
      icon: BarChart3,
      link: '/analytics',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      title: 'Leaderboard',
      description: 'Compare with others',
      icon: Trophy,
      link: '/leaderboard',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
    },
  ];

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-primary-600' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${color} dark:${color.replace('text-', 'text-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700`}>
          <Icon className={`w-6 h-6 ${color} dark:${color.replace('text-', 'text-')}`} />
        </div>
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, link, color, hoverColor }) => (
    <Link to={link}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`${color} ${hoverColor} text-white p-6 rounded-xl shadow-lg transition-all duration-300 group`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-white/80 text-sm">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon className="w-6 h-6" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - AdaptiveExam</title>
        <meta name="description" content="Your personalized learning dashboard with progress tracking and quick access to quizzes." />
      </Helmet>

      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white p-8 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
              </h1>
              <p className="text-primary-100 text-lg">
                Ready to continue your learning journey?
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-primary-100 text-sm">Today's Date</p>
                <p className="text-white font-semibold">{formatDate(new Date())}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={BookOpen}
            title="Total Quizzes"
            value={stats?.totalQuizzes || 0}
            subtitle="Completed sessions"
            color="text-primary-600"
          />
          <StatCard
            icon={Target}
            title="Average Score"
            value={stats?.averageScore ? `${formatPercentage(stats.averageScore)}%` : '0%'}
            subtitle="Overall performance"
            color="text-green-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Improvement"
            value={stats?.improvement ? `+${formatPercentage(stats.improvement)}%` : '0%'}
            subtitle="This month"
            color="text-blue-600"
          />
          <StatCard
            icon={Clock}
            title="Study Time"
            value={stats?.totalStudyTime || '0h'}
            subtitle="Total hours"
            color="text-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuickActionCard {...action} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Quizzes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Quizzes
              </h3>
              <Link 
                to="/quiz-history" 
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {recentQuizzes.length > 0 ? (
              <div className="space-y-4">
                {recentQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {quiz.title || `Quiz ${quiz.id}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(quiz.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getScoreColor(quiz.score)}`}>
                        {formatPercentage(quiz.score)}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {quiz.questionsCount} questions
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No quizzes completed yet
                </p>
                <Link to="/quiz" className="btn-primary">
                  Take Your First Quiz
                </Link>
              </div>
            )}
          </motion.div>

          {/* Achievements & Goals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Achievements
              </h3>
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            
            <div className="space-y-4">
              {/* Sample achievements */}
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">First Quiz</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed your first quiz</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Target className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">High Scorer</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scored above 80%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quick Learner</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed 5 quizzes</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Weekly Goal</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Complete 3 quizzes</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2/3</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '66%' }}></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;