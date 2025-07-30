import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import {
  formatDate,
  formatDuration,
  calculatePercentage,
  getScoreColor,
  getDifficultyColor,
  generateChartColors,
} from '../utils/helpers';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  const [analytics, setAnalytics] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedCategory]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getAnalytics({
        timeRange,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const handleExport = async () => {
    try {
      // This would typically generate and download a PDF or CSV report
      toast.success('Analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'literature', label: 'Literature' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'geography', label: 'Geography' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Analytics Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Take some quizzes to see your performance analytics.
        </p>
      </div>
    );
  }

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
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  const PerformanceChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Over Time
        </h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {analytics.performanceHistory?.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(item.date)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.score}%
              </span>
              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const CategoryBreakdown = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance by Category
        </h3>
        <PieChart className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {analytics.categoryPerformance?.map((category, index) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {category.name}
              </span>
              <span className={`text-sm font-medium ${getScoreColor(category.averageScore)}`}>
                {category.averageScore}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${category.averageScore}%`,
                    backgroundColor: generateChartColors(1)[0],
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">
                {category.totalQuizzes} quizzes
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const RecentActivity = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {analytics.recentQuizzes?.map((quiz, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getDifficultyColor(quiz.difficulty)}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {quiz.title}
                </p>
                <p className="text-xs text-gray-500">
                  {quiz.category} • {formatDate(quiz.completedAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${getScoreColor(quiz.score)}`}>
                {quiz.score}%
              </p>
              <p className="text-xs text-gray-500">
                {formatDuration(quiz.timeSpent)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const StrengthsAndWeaknesses = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Strengths & Areas for Improvement
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-success-600 dark:text-success-400 mb-3 flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Strengths
          </h4>
          <div className="space-y-2">
            {analytics.strengths?.map((strength, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-success-50 dark:bg-success-900/20 rounded">
                <span className="text-sm text-success-800 dark:text-success-200">
                  {strength.topic}
                </span>
                <span className="text-sm font-medium text-success-600 dark:text-success-400">
                  {strength.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-warning-600 dark:text-warning-400 mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Areas for Improvement
          </h4>
          <div className="space-y-2">
            {analytics.weaknesses?.map((weakness, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-warning-50 dark:bg-warning-900/20 rounded">
                <span className="text-sm text-warning-800 dark:text-warning-200">
                  {weakness.topic}
                </span>
                <span className="text-sm font-medium text-warning-600 dark:text-warning-400">
                  {weakness.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Analytics - AdaptiveExam</title>
        <meta name="description" content="View your quiz performance analytics and insights." />
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
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your learning progress and performance insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-outline flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="btn-primary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filters:
            </span>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input w-auto"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-auto"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Quizzes"
            value={analytics.totalQuizzes}
            change={analytics.quizzesChange}
            icon={BarChart3}
            color="primary"
          />
          <StatCard
            title="Average Score"
            value={`${analytics.averageScore}%`}
            change={analytics.scoreChange}
            icon={Target}
            color="success"
          />
          <StatCard
            title="Study Time"
            value={formatDuration(analytics.totalStudyTime)}
            change={analytics.timeChange}
            icon={Clock}
            color="warning"
          />
          <StatCard
            title="Achievements"
            value={analytics.totalAchievements}
            change={analytics.achievementsChange}
            icon={Award}
            color="purple"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PerformanceChart />
          <CategoryBreakdown />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity />
          <StrengthsAndWeaknesses />
        </div>

        {/* Study Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personalized Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.recommendations?.map((recommendation, index) => (
              <div key={index} className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2">
                  {recommendation.title}
                </h4>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  {recommendation.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Analytics;