const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Option cannot exceed 500 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct answer index must be 0 or greater'],
    max: [3, 'Correct answer index must be 3 or less']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'History',
      'Geography',
      'Economics',
      'Psychology',
      'General Knowledge',
      'Other'
    ]
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  topic: {
    type: String,
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  source: {
    type: String,
    enum: ['manual', 'ai-generated', 'imported'],
    default: 'manual'
  },
  aiModel: {
    type: String,
    enum: ['gpt-4', 'llama-3', 'manual'],
    default: 'manual'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  correctRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageTime: {
    type: Number,
    default: 0 // in seconds
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validate that exactly one option is correct
questionSchema.pre('save', function(next) {
  const correctOptions = this.options.filter(option => option.isCorrect);
  
  if (correctOptions.length !== 1) {
    return next(new Error('Exactly one option must be marked as correct'));
  }
  
  // Set correctAnswer index based on the correct option
  this.correctAnswer = this.options.findIndex(option => option.isCorrect);
  
  next();
});

// Index for efficient querying
questionSchema.index({ subject: 1, difficulty: 1, isActive: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ correctRate: 1 });

// Update question statistics
questionSchema.methods.updateStats = function(isCorrect, timeSpent) {
  this.usageCount += 1;
  
  // Update correct rate
  const totalCorrect = Math.round((this.correctRate / 100) * (this.usageCount - 1));
  const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
  this.correctRate = Math.round((newCorrect / this.usageCount) * 100);
  
  // Update average time
  const totalTime = this.averageTime * (this.usageCount - 1);
  this.averageTime = Math.round((totalTime + timeSpent) / this.usageCount);
  
  this.lastUsed = new Date();
};

// Static method to get questions by difficulty and subject
questionSchema.statics.getAdaptiveQuestions = async function(difficulty, subject, excludeIds = [], limit = 10) {
  const query = {
    difficulty,
    isActive: true,
    _id: { $nin: excludeIds }
  };
  
  if (subject && subject !== 'all') {
    query.subject = subject;
  }
  
  return this.find(query)
    .limit(limit)
    .sort({ usageCount: 1, correctRate: -1 }) // Prefer less used questions with higher difficulty
    .populate('createdBy', 'name');
};

module.exports = mongoose.model('Question', questionSchema);