const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { QuizResult } = require('../models/Quiz');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, avatar } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (avatar) updateFields.avatar = avatar;
    
    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
      updateFields.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', protect, [
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be light or dark'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { theme, difficulty, subjects } = req.body;
    const updateFields = {};

    if (theme) updateFields['preferences.theme'] = theme;
    if (difficulty) updateFields['preferences.difficulty'] = difficulty;
    if (subjects) updateFields['preferences.subjects'] = subjects;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent quiz results
    const recentQuizzes = await QuizResult.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('quiz', 'title')
      .select('score subject createdAt isAdaptive totalQuestions correctAnswers');

    // Get overall statistics
    const totalQuizzes = await QuizResult.countDocuments({ user: userId });
    const allResults = await QuizResult.find({ user: userId });
    
    let averageScore = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let subjectPerformance = {};
    
    if (allResults.length > 0) {
      averageScore = allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length;
      totalQuestions = allResults.reduce((sum, result) => sum + result.totalQuestions, 0);
      totalCorrect = allResults.reduce((sum, result) => sum + result.correctAnswers, 0);
      
      // Calculate subject performance
      allResults.forEach(result => {
        if (!subjectPerformance[result.subject]) {
          subjectPerformance[result.subject] = {
            subject: result.subject,
            totalQuizzes: 0,
            averageScore: 0,
            totalQuestions: 0,
            correctAnswers: 0
          };
        }
        
        subjectPerformance[result.subject].totalQuizzes++;
        subjectPerformance[result.subject].totalQuestions += result.totalQuestions;
        subjectPerformance[result.subject].correctAnswers += result.correctAnswers;
      });
      
      // Calculate average scores for each subject
      Object.values(subjectPerformance).forEach(subject => {
        subject.averageScore = subject.totalQuestions > 0 
          ? (subject.correctAnswers / subject.totalQuestions) * 100 
          : 0;
      });
    }

    // Get weekly progress (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyQuizzes = await QuizResult.find({
      user: userId,
      createdAt: { $gte: weekAgo }
    }).sort({ createdAt: 1 });

    // Group by day
    const dailyProgress = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyProgress[dateKey] = {
        date: dateKey,
        quizzes: 0,
        averageScore: 0,
        totalQuestions: 0
      };
    }

    weeklyQuizzes.forEach(quiz => {
      const dateKey = quiz.createdAt.toISOString().split('T')[0];
      if (dailyProgress[dateKey]) {
        dailyProgress[dateKey].quizzes++;
        dailyProgress[dateKey].totalQuestions += quiz.totalQuestions;
        dailyProgress[dateKey].averageScore = 
          (dailyProgress[dateKey].averageScore * (dailyProgress[dateKey].quizzes - 1) + quiz.score) / 
          dailyProgress[dateKey].quizzes;
      }
    });

    // Get achievements/milestones
    const achievements = [];
    
    if (totalQuizzes >= 10) achievements.push({ name: 'Quiz Master', description: 'Completed 10 quizzes' });
    if (totalQuizzes >= 50) achievements.push({ name: 'Quiz Expert', description: 'Completed 50 quizzes' });
    if (averageScore >= 90) achievements.push({ name: 'High Achiever', description: 'Maintained 90%+ average score' });
    if (req.user.stats.currentStreak >= 5) achievements.push({ name: 'On Fire', description: '5+ quiz streak' });

    // Recommendations based on performance
    const recommendations = [];
    
    if (averageScore < 70) {
      recommendations.push('Focus on reviewing basic concepts before taking more quizzes');
    }
    
    const weakSubjects = Object.values(subjectPerformance)
      .filter(subject => subject.averageScore < 60)
      .sort((a, b) => a.averageScore - b.averageScore);
    
    if (weakSubjects.length > 0) {
      recommendations.push(`Consider studying ${weakSubjects[0].subject} - your weakest subject`);
    }
    
    if (totalQuizzes < 5) {
      recommendations.push('Take more quizzes to get a better assessment of your knowledge');
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalQuizzes,
          averageScore: Math.round(averageScore),
          totalQuestions,
          totalCorrect,
          accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
          currentStreak: req.user.stats.currentStreak,
          longestStreak: req.user.stats.longestStreak
        },
        recentQuizzes,
        subjectPerformance: Object.values(subjectPerformance),
        weeklyProgress: Object.values(dailyProgress),
        achievements,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// @desc    Get user leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all'; // all, week, month
    const subject = req.query.subject || 'all';
    const limit = parseInt(req.query.limit) || 10;

    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // Aggregate user performance
    const pipeline = [
      { $match: dateFilter },
      ...(subject !== 'all' ? [{ $match: { subject } }] : []),
      {
        $group: {
          _id: '$user',
          totalQuizzes: { $sum: 1 },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctAnswers' },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          avatar: '$user.avatar',
          totalQuizzes: 1,
          totalQuestions: 1,
          totalCorrect: 1,
          averageScore: { $round: ['$averageScore', 1] },
          bestScore: 1,
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { averageScore: -1, totalQuizzes: -1 } },
      { $limit: limit }
    ];

    const leaderboard = await QuizResult.aggregate(pipeline);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user._id.toString() === req.user._id.toString()
    }));

    // Get current user's position if not in top results
    let currentUserRank = null;
    const currentUserInTop = rankedLeaderboard.find(user => user.isCurrentUser);
    
    if (!currentUserInTop) {
      const allUsers = await QuizResult.aggregate([
        { $match: dateFilter },
        ...(subject !== 'all' ? [{ $match: { subject } }] : []),
        {
          $group: {
            _id: '$user',
            averageScore: { $avg: '$score' },
            totalQuizzes: { $sum: 1 }
          }
        },
        { $sort: { averageScore: -1, totalQuizzes: -1 } }
      ]);
      
      const userIndex = allUsers.findIndex(user => user._id.toString() === req.user._id.toString());
      if (userIndex !== -1) {
        currentUserRank = userIndex + 1;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        currentUserRank: currentUserInTop ? currentUserInTop.rank : currentUserRank,
        timeframe,
        subject,
        totalUsers: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete user's quiz results
    await QuizResult.deleteMany({ user: req.user._id });
    
    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

module.exports = router;