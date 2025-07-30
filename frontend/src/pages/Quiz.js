import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Flag,
  AlertCircle,
  BookOpen,
  Target,
  RotateCcw,
} from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import useTimer from '../hooks/useTimer';
import { formatTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [error, setError] = useState(null);
  
  const quizId = searchParams.get('id');
  const timeLimit = quiz?.timeLimit || 30; // Default 30 minutes
  
  const {
    timeLeft,
    isRunning,
    start: startTimer,
    stop: stopTimer,
    formatTime: formatTimeLeft,
    isTimeRunningLow,
    isTimeCritical,
  } = useTimer(timeLimit * 60); // Convert minutes to seconds

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        let response;
        
        if (quizId) {
          // Load specific quiz
          response = await quizAPI.getQuiz(quizId);
        } else {
          // Generate new quiz
          response = await quizAPI.generateQuiz({
            difficulty: searchParams.get('difficulty') || 'medium',
            category: searchParams.get('category') || 'general',
            questionCount: parseInt(searchParams.get('count')) || 10,
          });
        }
        
        setQuiz(response.data);
        startTimer();
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
        console.error('Quiz fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, searchParams, startTimer]);

  useEffect(() => {
    // Auto-submit when time runs out
    if (timeLeft === 0 && quiz) {
      handleSubmitQuiz(true);
    }
  }, [timeLeft, quiz]);

  useEffect(() => {
    // Show warning when time is running low
    if (isTimeRunningLow && !isTimeCritical) {
      toast.warning('5 minutes remaining!', {
        id: 'time-warning',
        duration: 3000,
      });
    } else if (isTimeCritical) {
      toast.error('1 minute remaining!', {
        id: 'time-critical',
        duration: 3000,
      });
    }
  }, [isTimeRunningLow, isTimeCritical]);

  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && Object.keys(answers).length < quiz.questions.length) {
      setShowConfirmSubmit(true);
      return;
    }

    setSubmitting(true);
    stopTimer();
    
    try {
      const response = await quizAPI.submitQuiz(quiz.id, {
        answers,
        timeSpent: (timeLimit * 60) - timeLeft,
        autoSubmit,
      });
      
      toast.success('Quiz submitted successfully!');
      navigate(`/quiz-results?id=${response.data.resultId}`);
    } catch (err) {
      toast.error('Failed to submit quiz. Please try again.');
      console.error('Quiz submission error:', err);
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  };

  if (loading) {
    return <LoadingSpinner text="Loading quiz..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Quiz Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-outline"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <>
      <Helmet>
        <title>Quiz - AdaptiveExam</title>
        <meta name="description" content="Take your personalized quiz and test your knowledge." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Quiz Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {quiz.title || 'Quiz Session'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isTimeCritical 
                ? 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300'
                : isTimeRunningLow 
                ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-semibold">
                {formatTimeLeft()}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress: {Math.round(getProgressPercentage())}%</span>
            <span>Answered: {getAnsweredCount()}/{quiz.questions.length}</span>
          </div>
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-8 mb-6"
          >
            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                    {currentQuestionIndex + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {currentQuestion.question}
                  </h2>
                  {currentQuestion.difficulty && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentQuestion.difficulty === 'easy' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : currentQuestion.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionKey = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = answers[currentQuestion.id] === optionKey;
                
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAnswerSelect(currentQuestion.id, optionKey)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{optionKey}.</span>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={handlePreviousQuestion}
            disabled={isFirstQuestion}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="btn-outline text-primary-600 border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center"
            >
              <Flag className="w-4 h-4 mr-2" />
              Submit Quiz
            </button>
            
            {!isLastQuestion ? (
              <button
                onClick={handleNextQuestion}
                className="btn-primary flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="btn-primary flex items-center"
              >
                <Target className="w-4 h-4 mr-2" />
                Finish Quiz
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Confirm Submit Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmSubmit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Submit Quiz?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You have answered {getAnsweredCount()} out of {quiz.questions.length} questions.
                  {getAnsweredCount() < quiz.questions.length && (
                    <span className="block mt-2 text-warning-600 dark:text-warning-400">
                      Unanswered questions will be marked as incorrect.
                    </span>
                  )}
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="btn-outline flex-1"
                    disabled={submitting}
                  >
                    Continue Quiz
                  </button>
                  <button
                    onClick={() => handleSubmitQuiz()}
                    disabled={submitting}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Submit Quiz'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Quiz;