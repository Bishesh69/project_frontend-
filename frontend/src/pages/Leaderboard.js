import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Search,
  Star,
  Award,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import { formatDate, formatDuration } from '../utils/helpers';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overall'); // overall, weekly, monthly, category
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, selectedCategory, timeRange]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getLeaderboard({
        type: activeTab,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        timeRange: timeRange !== 'all' ? timeRange : undefined,
      });
      setLeaderboardData(data);
    } catch (error) {
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overall', label: 'Overall', icon: Trophy },
    { id: 'weekly', label: 'This Week', icon: Calendar },
    { id: 'monthly', label: 'This Month', icon: TrendingUp },
    { id: 'category', label: 'By Category', icon: Target },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'science', label: 'Science' },
    { value: 'history', label: 'History' },
    { value: 'literature', label: 'Literature' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'geography', label: 'Geography' },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {rank}
            </span>
          </div>
        );
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        2: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[rank]}`}>
          #{rank}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        #{rank}
      </span>
    );
  };

  const UserCard = ({ userData, rank, isCurrentUser = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`p-4 rounded-lg border transition-all ${
        isCurrentUser
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {getRankIcon(rank)}
            {getRankBadge(rank)}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {userData.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </h3>
                {userData.badges?.map((badge, index) => (
                  <span
                    key={index}
                    className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-1 py-0.5 rounded"
                    title={badge.description}
                  >
                    {badge.name}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userData.totalQuizzes} quizzes • Joined {formatDate(userData.joinedAt)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {userData.averageScore}%
              </p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {userData.totalPoints}
              </p>
              <p className="text-xs text-gray-500">Points</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                {userData.streak}
              </p>
              <p className="text-xs text-gray-500">Streak</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const TopPerformers = () => {
    if (!leaderboardData?.topPerformers) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {leaderboardData.topPerformers.slice(0, 3).map((performer, index) => {
          const rank = index + 1;
          const isCurrentUser = performer.id === user?.id;
          
          return (
            <div
              key={performer.id}
              className={`card p-6 text-center relative overflow-hidden ${
                rank === 1 ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {rank === 1 && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-medium">
                  Champion
                </div>
              )}
              
              <div className="mb-4">
                {getRankIcon(rank)}
              </div>
              
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                {performer.avatar ? (
                  <img
                    src={performer.avatar}
                    alt={performer.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-primary-600 dark:text-primary-400">
                    {performer.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {performer.name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Score:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {performer.averageScore}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Points:</span>
                  <span className="font-medium text-primary-600 dark:text-primary-400">
                    {performer.totalPoints}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Streak:</span>
                  <span className="font-medium text-success-600 dark:text-success-400">
                    {performer.streak} days
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  };

  const filteredUsers = leaderboardData?.users?.filter((userData) =>
    userData.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading leaderboard..." />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Leaderboard - AdaptiveExam</title>
        <meta name="description" content="See how you rank against other users and compete for the top spot." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compete with other learners and climb the ranks
          </p>
        </motion.div>

        {/* User's Current Position */}
        {leaderboardData?.currentUserRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Star className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Current Rank
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You're ranked #{leaderboardData.currentUserRank.rank} out of {leaderboardData.totalUsers} users
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  #{leaderboardData.currentUserRank.rank}
                </p>
                <p className="text-sm text-gray-500">
                  {leaderboardData.currentUserRank.percentile}th percentile
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
          
          {activeTab === 'category' && (
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
          )}
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </motion.div>

        {/* Top Performers */}
        <TopPerformers />

        {/* Stats Overview */}
        {leaderboardData?.stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <div className="card p-6 text-center">
              <Users className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaderboardData.stats.totalUsers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            </div>
            
            <div className="card p-6 text-center">
              <Target className="w-8 h-8 text-success-600 dark:text-success-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaderboardData.stats.averageScore}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
            </div>
            
            <div className="card p-6 text-center">
              <Zap className="w-8 h-8 text-warning-600 dark:text-warning-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaderboardData.stats.totalQuizzes}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes Taken</p>
            </div>
            
            <div className="card p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leaderboardData.stats.activeUsers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active This Week</p>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Rankings
          </h3>
          
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((userData, index) => {
                const rank = userData.rank || index + 1;
                const isCurrentUser = userData.id === user?.id;
                
                return (
                  <UserCard
                    key={userData.id}
                    userData={userData}
                    rank={rank}
                    isCurrentUser={isCurrentUser}
                  />
                );
              })
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No users found matching your search.' : 'No leaderboard data available.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Leaderboard;