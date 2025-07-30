import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
  Share2,
  Download,
  TrendingUp,
  Award,
  Brain,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import { formatTime, formatPercentage, getScoreColor, formatDuration } from '../utils/helpers';
import toast from 'react-hot-toast';

const QuizResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  const resultId = searchParams.get('id');

  useEffect(() => {
    const fetchResults = async () => {
      if (!resultId) {
        setError('No result ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await quizAPI.getQuizResults(resultId);
        setResults(response.data);
      } catch (err) {
        setError('Failed to load quiz results');
        console.error('Results fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [resultId]);

  const getScoreMessage = (score) => {
    if (score >= 90) return { message: 'Outstanding! 🎉', color: 'text-green-600' };
    if (score >= 80) return { message: 'Excellent work! 👏', color: 'text-green-600' };
    if (score >= 70) return { message: 'Good job! 👍', color: 'text-blue-600' };
    if (score >= 60) return { message: 'Not bad! 📚', color: 'text-yellow-600' };
    return { message: 'Keep practicing! 💪', color: 'text-orange-600' };
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Quiz Results - AdaptiveExam',
          text: `I scored ${formatPercentage(results.score)}% on my quiz!`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `I scored ${formatPercentage(results.score)}% on my AdaptiveExam quiz! ${window.location.href}`
        );
        toast.success('Results link copied to clipboard!');
      }
    } catch (err) {
      toast.error('Failed to share results');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await quizAPI.downloadReport(resultId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-report-${resultId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  if (error || !results) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Results Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The quiz results you\'re looking for could not be found.'}
          </p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const scoreMessage = getScoreMessage(results.score);
  const performanceLevel = getPerformanceLevel(results.score);

  return (
    <>
      <Helmet>
        <title>Quiz Results - AdaptiveExam</title>
        <meta name="description" content="View your quiz results and performance analytics." />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz Completed!
          </h1>
          <p className={`text-xl font-semibold ${scoreMessage.color} mb-4`}>
            {scoreMessage.message}
          </p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-8 text-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800"
        >
          <div className="mb-6">
            <div className={`text-6xl font-bold ${getScoreColor(results.score)} mb-2`}>
              {formatPercentage(results.score)}%
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Performance Level: <span className="font-semibold">{performanceLevel}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {results.correctAnswers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {results.incorrectAnswers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatDuration(results.timeSpent)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            </div>
          </div>
        </motion.div>

        {/* Performance Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Performance Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Strengths</h3>
              <div className="space-y-2">
                {results.insights?.strengths?.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{strength}</span>
                  </div>
                )) || (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Keep practicing to identify your strengths!
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Areas for Improvement</h3>
              <div className="space-y-2">
                {results.insights?.improvements?.map((improvement, index) => (
                  <div key={index} className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">{improvement}</span>
                  </div>
                )) || (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Great job! No specific areas identified for improvement.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Results */}
        {results.questions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Question Review
              </h2>
              <button
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                className="btn-outline text-sm"
              >
                {showDetailedResults ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showDetailedResults && (
              <div className="space-y-4">
                {results.questions.map((question, index) => {
                  const isCorrect = question.userAnswer === question.correctAnswer;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Question {index + 1}
                        </h3>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {question.question}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600 dark:text-gray-400">Your answer:</span>
                          <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {question.userAnswer || 'Not answered'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-400">Correct answer:</span>
                            <span className="text-green-600 dark:text-green-400">
                              {question.correctAnswer}
                            </span>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link to="/quiz" className="btn-primary flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Another Quiz
          </Link>
          
          <Link to="/dashboard" className="btn-outline flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <button
            onClick={handleShare}
            className="btn-outline flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </button>
          
          <button
            onClick={handleDownloadReport}
            className="btn-outline flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            What's Next?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/ai-generate"
              className="flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <div>
                <h3 className="font-medium mb-1">Generate More Questions</h3>
                <p className="text-sm text-primary-100">Create personalized quizzes with AI</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              to="/analytics"
              className="flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <div>
                <h3 className="font-medium mb-1">View Analytics</h3>
                <p className="text-sm text-primary-100">Track your learning progress</p>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default QuizResults;