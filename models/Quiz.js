const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'adaptive'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  timeLimit: {
    type: Number,
    default: 30, // minutes
    min: [1, 'Time limit must be at least 1 minute'],
    max: [180, 'Time limit cannot exceed 180 minutes']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  settings: {
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    randomizeOptions: {
      type: Boolean,
      default: true
    },
    allowRetake: {
      type: Boolean,
      default: true
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  },
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
quizSchema.index({ subject: 1, difficulty: 1, isActive: 1, isPublic: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ tags: 1 });

module.exports = mongoose.model('Quiz', quizSchema);

// Quiz Result Schema
const quizResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  isAdaptive: {
    type: Boolean,
    default: false
  },
  subject: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  questions: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    correctAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    }
  }],
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  score: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    default: false
  },
  adaptiveData: {
    startingDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    finalDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    difficultyProgression: [{
      questionNumber: Number,
      difficulty: String,
      isCorrect: Boolean
    }]
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  }
}, {
  timestamps: true
});

// Calculate score before saving
quizResultSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
    this.passed = this.score >= 70; // Default passing score
  }
  next();
});

// Index for efficient querying
quizResultSchema.index({ user: 1, createdAt: -1 });
quizResultSchema.index({ quiz: 1 });
quizResultSchema.index({ subject: 1 });
quizResultSchema.index({ score: -1 });

module.exports.QuizResult = mongoose.model('QuizResult', quizResultSchema);