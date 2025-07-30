const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { Quiz, QuizResult } = require('../models/Quiz');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Adaptive quiz logic
class AdaptiveQuizEngine {
  constructor() {
    this.difficultyLevels = ['easy', 'medium', 'hard'];
    this.startingDifficulty = 'medium';
  }

  // Determine next difficulty based on performance
  getNextDifficulty(currentDifficulty, isCorrect, consecutiveCorrect = 0, consecutiveWrong = 0) {
    const currentIndex = this.difficultyLevels.indexOf(currentDifficulty);
    
    if (isCorrect) {
      // Move to harder difficulty after 2 consecutive correct answers
      if (consecutiveCorrect >= 2 && currentIndex < this.difficultyLevels.length - 1) {
        return this.difficultyLevels[currentIndex + 1];
      }
    } else {
      // Move to easier difficulty after 2 consecutive wrong answers
      if (consecutiveWrong >= 2 && currentIndex > 0) {
        return this.difficultyLevels[currentIndex - 1];
      }
    }
    
    return currentDifficulty;
  }

  // Calculate adaptive score based on difficulty progression
  calculateAdaptiveScore(answers) {
    let totalScore = 0;
    const difficultyWeights = { easy: 1, medium: 1.5, hard: 2 };
    
    answers.forEach(answer => {
      if (answer.isCorrect) {
        totalScore += difficultyWeights[answer.difficulty];
      }
    });
    
    const maxPossibleScore = answers.reduce((sum, answer) => {
      return sum + difficultyWeights[answer.difficulty];
    }, 0);
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  // Generate feedback based on performance
  generateFeedback(answers, finalDifficulty) {
    const subjectPerformance = {};
    const difficultyPerformance = { easy: 0, medium: 0, hard: 0 };
    
    answers.forEach(answer => {
      const subject = answer.question.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { correct: 0, total: 0 };
      }
      
      subjectPerformance[subject].total++;
      difficultyPerformance[answer.difficulty]++;
      
      if (answer.isCorrect) {
        subjectPerformance[subject].correct++;
      }
    });
    
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];
    
    // Analyze subject performance
    Object.entries(subjectPerformance).forEach(([subject, performance]) => {
      const accuracy = (performance.correct / performance.total) * 100;
      
      if (accuracy >= 80) {
        strengths.push(`Strong performance in ${subject} (${accuracy.toFixed(1)}% accuracy)`);
      } else if (accuracy < 50) {
        weaknesses.push(`Needs improvement in ${subject} (${accuracy.toFixed(1)}% accuracy)`);
        recommendations.push(`Focus on studying ${subject} fundamentals`);
      }
    });
    
    // Difficulty-based recommendations
    if (finalDifficulty === 'hard') {
      recommendations.push('Excellent! You\'re ready for advanced topics');
    } else if (finalDifficulty === 'easy') {
      recommendations.push('Review basic concepts and practice more questions');
    }
    
    return { strengths, weaknesses, recommendations };
  }
}

const adaptiveEngine = new AdaptiveQuizEngine();

// @desc    Start adaptive quiz
// @route   POST /api/quizzes/adaptive/start
// @access  Private
router.post('/adaptive/start', protect, [
  body('subject')
    .optional()
    .notEmpty()
    .withMessage('Subject cannot be empty if provided'),
  body('questionCount')
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage('Question count must be between 5 and 50')
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

    const { subject = 'all', questionCount = 10 } = req.body;
    const startingDifficulty = adaptiveEngine.startingDifficulty;

    // Get first question
    const questions = await Question.getAdaptiveQuestions(startingDifficulty, subject, [], 1);
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions available for the selected criteria'
      });
    }

    // Create quiz session
    const quizSession = {
      sessionId: `adaptive_${Date.now()}_${req.user._id}`,
      userId: req.user._id,
      subject,
      questionCount,
      currentQuestion: 1,
      currentDifficulty: startingDifficulty,
      startTime: new Date(),
      answers: [],
      usedQuestionIds: [questions[0]._id],
      consecutiveCorrect: 0,
      consecutiveWrong: 0
    };

    // Store session in memory or cache (Redis recommended for production)
    // For now, we'll use a simple in-memory store
    global.quizSessions = global.quizSessions || new Map();
    global.quizSessions.set(quizSession.sessionId, quizSession);

    res.status(200).json({
      success: true,
      data: {
        sessionId: quizSession.sessionId,
        currentQuestion: quizSession.currentQuestion,
        totalQuestions: questionCount,
        currentDifficulty: startingDifficulty,
        question: {
          id: questions[0]._id,
          question: questions[0].question,
          options: questions[0].options.map(option => option.text),
          subject: questions[0].subject,
          topic: questions[0].topic,
          difficulty: questions[0].difficulty
        }
      }
    });
  } catch (error) {
    console.error('Start adaptive quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start adaptive quiz'
    });
  }
});

// @desc    Submit answer and get next question
// @route   POST /api/quizzes/adaptive/answer
// @access  Private
router.post('/adaptive/answer', protect, [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('selectedAnswer')
    .isInt({ min: 0, max: 3 })
    .withMessage('Selected answer must be between 0 and 3'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
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

    const { sessionId, questionId, selectedAnswer, timeSpent = 0 } = req.body;

    // Get quiz session
    global.quizSessions = global.quizSessions || new Map();
    const session = global.quizSessions.get(sessionId);
    
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found or unauthorized'
      });
    }

    // Get the question to check answer
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    
    // Update question statistics
    question.updateStats(isCorrect, timeSpent);
    await question.save();

    // Record answer
    const answerRecord = {
      question: question,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeSpent,
      difficulty: question.difficulty
    };
    
    session.answers.push(answerRecord);

    // Update consecutive counters
    if (isCorrect) {
      session.consecutiveCorrect++;
      session.consecutiveWrong = 0;
    } else {
      session.consecutiveWrong++;
      session.consecutiveCorrect = 0;
    }

    // Check if quiz is complete
    if (session.currentQuestion >= session.questionCount) {
      // Quiz completed - calculate final results
      const endTime = new Date();
      const totalTimeSpent = Math.round((endTime - session.startTime) / 1000);
      const correctAnswers = session.answers.filter(a => a.isCorrect).length;
      const adaptiveScore = adaptiveEngine.calculateAdaptiveScore(session.answers);
      const feedback = adaptiveEngine.generateFeedback(session.answers, session.currentDifficulty);

      // Save quiz result
      const quizResult = new QuizResult({
        user: req.user._id,
        isAdaptive: true,
        subject: session.subject,
        startTime: session.startTime,
        endTime,
        timeSpent: totalTimeSpent,
        questions: session.answers.map(answer => ({
          question: answer.question._id,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent,
          difficulty: answer.difficulty
        })),
        totalQuestions: session.questionCount,
        correctAnswers,
        score: adaptiveScore,
        adaptiveData: {
          startingDifficulty: adaptiveEngine.startingDifficulty,
          finalDifficulty: session.currentDifficulty,
          difficultyProgression: session.answers.map((answer, index) => ({
            questionNumber: index + 1,
            difficulty: answer.difficulty,
            isCorrect: answer.isCorrect
          }))
        },
        feedback
      });

      await quizResult.save();

      // Update user stats
      req.user.updateStats({
        totalQuestions: session.questionCount,
        correctAnswers,
        score: adaptiveScore
      });
      await req.user.save();

      // Clean up session
      global.quizSessions.delete(sessionId);

      return res.status(200).json({
        success: true,
        completed: true,
        data: {
          quizResult: {
            id: quizResult._id,
            score: adaptiveScore,
            correctAnswers,
            totalQuestions: session.questionCount,
            timeSpent: totalTimeSpent,
            passed: adaptiveScore >= 70,
            feedback
          },
          lastAnswer: {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
          }
        }
      });
    }

    // Get next difficulty level
    const nextDifficulty = adaptiveEngine.getNextDifficulty(
      session.currentDifficulty,
      isCorrect,
      session.consecutiveCorrect,
      session.consecutiveWrong
    );
    
    session.currentDifficulty = nextDifficulty;
    session.currentQuestion++;

    // Get next question
    const nextQuestions = await Question.getAdaptiveQuestions(
      nextDifficulty,
      session.subject,
      session.usedQuestionIds,
      1
    );

    if (nextQuestions.length === 0) {
      // No more questions available, end quiz early
      return res.status(200).json({
        success: true,
        completed: true,
        message: 'No more questions available',
        data: {
          lastAnswer: {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
          }
        }
      });
    }

    const nextQuestion = nextQuestions[0];
    session.usedQuestionIds.push(nextQuestion._id);

    // Update session
    global.quizSessions.set(sessionId, session);

    res.status(200).json({
      success: true,
      completed: false,
      data: {
        currentQuestion: session.currentQuestion,
        totalQuestions: session.questionCount,
        currentDifficulty: nextDifficulty,
        lastAnswer: {
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        },
        nextQuestion: {
          id: nextQuestion._id,
          question: nextQuestion.question,
          options: nextQuestion.options.map(option => option.text),
          subject: nextQuestion.subject,
          topic: nextQuestion.topic,
          difficulty: nextQuestion.difficulty
        }
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer'
    });
  }
});

// @desc    Get quiz results
// @route   GET /api/quizzes/results
// @access  Private
router.get('/results', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const subject = req.query.subject;

    const query = { user: req.user._id };
    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    const results = await QuizResult.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('quiz', 'title description')
      .populate('questions.question', 'question subject topic');

    const total = await QuizResult.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz results'
    });
  }
});

// @desc    Get quiz result by ID
// @route   GET /api/quizzes/results/:id
// @access  Private
router.get('/results/:id', protect, async (req, res) => {
  try {
    const result = await QuizResult.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('quiz', 'title description')
    .populate('questions.question', 'question options explanation subject topic');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get quiz result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz result'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/quizzes/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get overall stats
    const totalQuizzes = await QuizResult.countDocuments({ user: userId });
    const results = await QuizResult.find({ user: userId });
    
    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalQuizzes: 0,
          averageScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          subjectStats: [],
          difficultyStats: [],
          recentActivity: []
        }
      });
    }
    
    const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalCorrect = results.reduce((sum, result) => sum + result.correctAnswers, 0);
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    // Subject-wise stats
    const subjectStats = {};
    const difficultyStats = { easy: 0, medium: 0, hard: 0 };
    
    results.forEach(result => {
      if (!subjectStats[result.subject]) {
        subjectStats[result.subject] = {
          subject: result.subject,
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0
        };
      }
      
      subjectStats[result.subject].totalQuizzes++;
      subjectStats[result.subject].totalQuestions += result.totalQuestions;
      subjectStats[result.subject].correctAnswers += result.correctAnswers;
      
      // Count difficulty distribution
      if (result.adaptiveData && result.adaptiveData.finalDifficulty) {
        difficultyStats[result.adaptiveData.finalDifficulty]++;
      }
    });
    
    // Calculate average scores for subjects
    Object.values(subjectStats).forEach(stat => {
      stat.averageScore = stat.totalQuestions > 0 
        ? (stat.correctAnswers / stat.totalQuestions) * 100 
        : 0;
    });
    
    // Recent activity (last 10 quizzes)
    const recentActivity = results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(result => ({
        id: result._id,
        subject: result.subject,
        score: result.score,
        date: result.createdAt,
        isAdaptive: result.isAdaptive
      }));
    
    res.status(200).json({
      success: true,
      data: {
        totalQuizzes,
        averageScore: Math.round(averageScore),
        totalQuestions,
        correctAnswers: totalCorrect,
        accuracy: Math.round(accuracy),
        subjectStats: Object.values(subjectStats),
        difficultyStats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// @desc    Get available subjects
// @route   GET /api/quizzes/subjects
// @access  Private
router.get('/subjects', protect, async (req, res) => {
  try {
    const subjects = await Question.distinct('subject', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: subjects.sort()
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available subjects'
    });
  }
});

module.exports = router;