const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Question = require('../models/Question');
const { Quiz, QuizResult } = require('../models/Quiz');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply admin authorization to all routes
router.use(protect, authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalQuizzes = await QuizResult.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    // Get user registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get quiz activity trends (last 30 days)
    const quizActivity = await QuizResult.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get subject distribution
    const subjectDistribution = await Question.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          averageCorrectRate: { $avg: '$correctRate' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get difficulty distribution
    const difficultyDistribution = await Question.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performing users
    const topUsers = await QuizResult.aggregate([
      {
        $group: {
          _id: '$user',
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctAnswers' }
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
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalQuizzes: 1,
          averageScore: { $round: ['$averageScore', 1] },
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
              1
            ]
          }
        }
      },
      {
        $sort: { averageScore: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get recent activity
    const recentActivity = await QuizResult.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('user score subject createdAt isAdaptive');

    // Calculate growth rates
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    const newQuizzesThisWeek = await QuizResult.countDocuments({ createdAt: { $gte: lastWeek } });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalQuizzes,
          activeUsers,
          newUsersThisWeek,
          newQuizzesThisWeek
        },
        charts: {
          userRegistrations,
          quizActivity,
          subjectDistribution,
          difficultyDistribution
        },
        topUsers,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard data'
    });
  }
});

// @desc    Get all users with detailed info
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get quiz stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const quizStats = await QuizResult.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: null,
              totalQuizzes: { $sum: 1 },
              averageScore: { $avg: '$score' },
              lastQuiz: { $max: '$createdAt' }
            }
          }
        ]);

        return {
          ...user.toObject(),
          quizStats: quizStats[0] || {
            totalQuizzes: 0,
            averageScore: 0,
            lastQuiz: null
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', [
  body('role')
    .isIn(['student', 'admin'])
    .withMessage('Role must be student or admin')
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

    const { role } = req.body;
    const userId = req.params.id;

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's quiz results
    await QuizResult.deleteMany({ user: userId });
    
    // Delete user's questions
    await Question.deleteMany({ createdBy: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Get all questions
// @route   GET /api/admin/questions
// @access  Private/Admin
router.get('/questions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const subject = req.query.subject || '';
    const difficulty = req.query.difficulty || '';
    const source = req.query.source || '';

    // Build query
    const query = {};
    if (search) {
      query.question = { $regex: search, $options: 'i' };
    }
    if (subject) {
      query.subject = subject;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (source) {
      query.source = source;
    }

    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get admin questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questions'
    });
  }
});

// @desc    Create question
// @route   POST /api/admin/questions
// @access  Private/Admin
router.post('/questions', [
  body('question')
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Question is required and must be less than 1000 characters'),
  body('options')
    .isArray({ min: 4, max: 4 })
    .withMessage('Must provide exactly 4 options'),
  body('correctAnswer')
    .isInt({ min: 0, max: 3 })
    .withMessage('Correct answer must be between 0 and 3'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard')
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

    const {
      question,
      options,
      correctAnswer,
      subject,
      difficulty,
      topic,
      explanation,
      tags
    } = req.body;

    // Format options
    const formattedOptions = options.map((option, index) => ({
      text: option,
      isCorrect: index === correctAnswer
    }));

    const newQuestion = new Question({
      question,
      options: formattedOptions,
      correctAnswer,
      subject,
      difficulty,
      topic,
      explanation,
      tags: tags || [],
      source: 'manual',
      createdBy: req.user._id
    });

    await newQuestion.save();

    const populatedQuestion = await Question.findById(newQuestion._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: populatedQuestion
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question'
    });
  }
});

// @desc    Update question
// @route   PUT /api/admin/questions/:id
// @access  Private/Admin
router.put('/questions/:id', [
  body('question')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Question must be less than 1000 characters'),
  body('options')
    .optional()
    .isArray({ min: 4, max: 4 })
    .withMessage('Must provide exactly 4 options'),
  body('correctAnswer')
    .optional()
    .isInt({ min: 0, max: 3 })
    .withMessage('Correct answer must be between 0 and 3'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard')
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

    const questionId = req.params.id;
    const updateData = { ...req.body };

    // Format options if provided
    if (updateData.options && updateData.correctAnswer !== undefined) {
      updateData.options = updateData.options.map((option, index) => ({
        text: option,
        isCorrect: index === updateData.correctAnswer
      }));
    }

    const question = await Question.findByIdAndUpdate(
      questionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
});

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
});

// @desc    Get quiz analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Quiz completion trends
    const quizTrends = await QuizResult.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctAnswers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Subject performance
    const subjectPerformance = await QuizResult.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$subject',
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correctAnswers' }
        }
      },
      {
        $project: {
          subject: '$_id',
          totalQuizzes: 1,
          averageScore: { $round: ['$averageScore', 1] },
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
              1
            ]
          }
        }
      },
      {
        $sort: { totalQuizzes: -1 }
      }
    ]);

    // Difficulty progression analysis
    const difficultyAnalysis = await QuizResult.aggregate([
      {
        $match: {
          isAdaptive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$adaptiveData.finalDifficulty',
          count: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      }
    ]);

    // User engagement metrics
    const engagementMetrics = await User.aggregate([
      {
        $lookup: {
          from: 'quizresults',
          localField: '_id',
          foreignField: 'user',
          as: 'quizzes'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          lastLogin: 1,
          totalQuizzes: { $size: '$quizzes' },
          recentQuizzes: {
            $size: {
              $filter: {
                input: '$quizzes',
                cond: { $gte: ['$$this.createdAt', startDate] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $gt: ['$recentQuizzes', 0] }, 1, 0]
            }
          },
          averageQuizzesPerUser: { $avg: '$totalQuizzes' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeframe: parseInt(timeframe),
        quizTrends,
        subjectPerformance,
        difficultyAnalysis,
        engagementMetrics: engagementMetrics[0] || {
          totalUsers: 0,
          activeUsers: 0,
          averageQuizzesPerUser: 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
});

module.exports = router;