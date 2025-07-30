const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow text files, PDFs, and images
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only text, PDF, and image files are allowed.'));
    }
  }
});

// AI API configurations
const AI_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    model: 'gpt-4'
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    model: 'llama-3.1-70b-versatile'
  }
};

// Extract text from different file types
const extractTextFromFile = async (file) => {
  try {
    switch (file.mimetype) {
      case 'text/plain':
        return file.buffer.toString('utf-8');
      
      case 'application/pdf':
        const pdfData = await pdfParse(file.buffer);
        return pdfData.text;
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng', {
          logger: m => console.log(m)
        });
        return text;
      
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

// Generate questions using AI
const generateQuestionsWithAI = async (text, subject, difficulty, count = 5, aiProvider = 'groq') => {
  try {
    const config = AI_CONFIGS[aiProvider];
    
    if (!config) {
      throw new Error('Invalid AI provider');
    }

    const prompt = `
Generate ${count} multiple choice questions based on the following text. Each question should:

1. Be at ${difficulty} difficulty level
2. Be relevant to the subject: ${subject}
3. Have exactly 4 options (A, B, C, D)
4. Have only one correct answer
5. Include a brief explanation for the correct answer

Text to analyze:
"${text.substring(0, 3000)}" // Limit text to avoid token limits

Please respond with a JSON array in this exact format:
[
  {
    "question": "Question text here?",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct",
    "topic": "Specific topic within the subject"
  }
]

Ensure the response is valid JSON only, no additional text.`;

    const response = await axios.post(config.url, {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who creates high-quality multiple choice questions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: config.headers,
      timeout: 30000
    });

    const aiResponse = response.data.choices[0].message.content.trim();
    
    // Clean up the response to ensure it's valid JSON
    let cleanedResponse = aiResponse;
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const questions = JSON.parse(cleanedResponse);
    
    if (!Array.isArray(questions)) {
      throw new Error('AI response is not an array');
    }

    return questions.map(q => ({
      ...q,
      aiModel: aiProvider === 'openai' ? 'gpt-4' : 'llama-3',
      source: 'ai-generated'
    }));
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

// @desc    Generate questions from text
// @route   POST /api/ai/generate-from-text
// @access  Private
router.post('/generate-from-text', protect, [
  body('text')
    .isLength({ min: 50, max: 10000 })
    .withMessage('Text must be between 50 and 10000 characters'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10')
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

    const { text, subject, difficulty, count = 5, aiProvider = 'groq', saveToDatabase = true } = req.body;

    // Generate questions using AI
    const generatedQuestions = await generateQuestionsWithAI(text, subject, difficulty, count, aiProvider);

    let savedQuestions = [];
    
    if (saveToDatabase) {
      // Save questions to database
      for (const questionData of generatedQuestions) {
        try {
          const question = new Question({
            question: questionData.question,
            options: questionData.options.map((option, index) => ({
              text: option,
              isCorrect: index === questionData.correctAnswer
            })),
            correctAnswer: questionData.correctAnswer,
            subject,
            difficulty,
            topic: questionData.topic || subject,
            explanation: questionData.explanation,
            source: 'ai-generated',
            aiModel: questionData.aiModel,
            createdBy: req.user._id
          });

          const savedQuestion = await question.save();
          savedQuestions.push(savedQuestion);
        } catch (saveError) {
          console.error('Error saving question:', saveError);
          // Continue with other questions even if one fails
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedQuestions.length} questions successfully`,
      data: {
        generatedQuestions,
        savedQuestions: savedQuestions.length,
        aiProvider,
        subject,
        difficulty
      }
    });
  } catch (error) {
    console.error('Generate from text error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate questions from text'
    });
  }
});

// @desc    Generate questions from uploaded file
// @route   POST /api/ai/generate-from-file
// @access  Private
router.post('/generate-from-file', protect, upload.single('file'), [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10')
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { subject, difficulty, count = 5, aiProvider = 'groq', saveToDatabase = true } = req.body;

    // Extract text from file
    const extractedText = await extractTextFromFile(req.file);
    
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract sufficient text from file. Please ensure the file contains readable text.'
      });
    }

    // Generate questions using AI
    const generatedQuestions = await generateQuestionsWithAI(extractedText, subject, difficulty, count, aiProvider);

    let savedQuestions = [];
    
    if (saveToDatabase) {
      // Save questions to database
      for (const questionData of generatedQuestions) {
        try {
          const question = new Question({
            question: questionData.question,
            options: questionData.options.map((option, index) => ({
              text: option,
              isCorrect: index === questionData.correctAnswer
            })),
            correctAnswer: questionData.correctAnswer,
            subject,
            difficulty,
            topic: questionData.topic || subject,
            explanation: questionData.explanation,
            source: 'ai-generated',
            aiModel: questionData.aiModel,
            createdBy: req.user._id
          });

          const savedQuestion = await question.save();
          savedQuestions.push(savedQuestion);
        } catch (saveError) {
          console.error('Error saving question:', saveError);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedQuestions.length} questions from ${req.file.originalname}`,
      data: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        extractedTextLength: extractedText.length,
        generatedQuestions,
        savedQuestions: savedQuestions.length,
        aiProvider,
        subject,
        difficulty
      }
    });
  } catch (error) {
    console.error('Generate from file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate questions from file'
    });
  }
});

// @desc    Extract text from file (preview)
// @route   POST /api/ai/extract-text
// @access  Private
router.post('/extract-text', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const extractedText = await extractTextFromFile(req.file);
    
    res.status(200).json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText: extractedText.substring(0, 2000), // Preview first 2000 characters
        totalLength: extractedText.length
      }
    });
  } catch (error) {
    console.error('Extract text error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to extract text from file'
    });
  }
});

// @desc    Get AI generation history
// @route   GET /api/ai/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const questions = await Question.find({
      createdBy: req.user._id,
      source: 'ai-generated'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email');

    const total = await Question.countDocuments({
      createdBy: req.user._id,
      source: 'ai-generated'
    });

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
    console.error('Get AI history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI generation history'
    });
  }
});

module.exports = router;