const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    subjects: [{
      type: String,
      trim: true
    }]
  },
  stats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    weakAreas: [{
      subject: String,
      accuracy: Number
    }],
    strongAreas: [{
      subject: String,
      accuracy: Number
    }]
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update user stats
userSchema.methods.updateStats = function(quizResult) {
  this.stats.totalQuizzes += 1;
  this.stats.totalQuestions += quizResult.totalQuestions;
  this.stats.correctAnswers += quizResult.correctAnswers;
  this.stats.averageScore = (this.stats.correctAnswers / this.stats.totalQuestions) * 100;
  
  // Update streak
  if (quizResult.score >= 70) {
    this.stats.currentStreak += 1;
    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }
  } else {
    this.stats.currentStreak = 0;
  }
};

module.exports = mongoose.model('User', userSchema);