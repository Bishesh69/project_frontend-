import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Settings,
  Play,
  FileText,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  Zap,
  Upload,
  Link,
  Type,
  Save,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { quizAPI } from '../services/api';
import toast from 'react-hot-toast';

const AIGenerate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quick'); // quick, advanced, upload, saved
  
  // Quick generation state
  const [quickForm, setQuickForm] = useState({
    topic: '',
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 15,
  });
  
  // Advanced generation state
  const [advancedForm, setAdvancedForm] = useState({
    topic: '',
    subtopics: [''],
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 15,
    questionTypes: ['multiple-choice'],
    focusAreas: [''],
    learningObjectives: [''],
    excludeTopics: [''],
    language: 'en',
    complexity: 'balanced',
  });
  
  // Upload state
  const [uploadForm, setUploadForm] = useState({
    content: '',
    url: '',
    file: null,
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 15,
  });
  
  // Saved templates
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedTemplates();
    }
  }, [activeTab]);

  const fetchSavedTemplates = async () => {
    try {
      const templates = await quizAPI.getSavedTemplates();
      setSavedTemplates(templates);
    } catch (error) {
      toast.error('Failed to load saved templates');
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', description: 'Basic concepts and straightforward questions' },
    { value: 'medium', label: 'Medium', description: 'Moderate difficulty with some challenging elements' },
    { value: 'hard', label: 'Hard', description: 'Advanced concepts requiring deep understanding' },
  ];

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false', label: 'True/False' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
    { value: 'fill-blank', label: 'Fill in the Blank' },
  ];

  const complexityOptions = [
    { value: 'simple', label: 'Simple', description: 'Straightforward questions' },
    { value: 'balanced', label: 'Balanced', description: 'Mix of simple and complex questions' },
    { value: 'complex', label: 'Complex', description: 'Multi-layered, analytical questions' },
  ];

  const handleQuickGenerate = async (e) => {
    e.preventDefault();
    
    if (!quickForm.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    setLoading(true);
    try {
      const quiz = await quizAPI.generateQuiz({
        type: 'quick',
        ...quickForm,
      });
      
      toast.success('Quiz generated successfully!');
      navigate(`/quiz?id=${quiz.id}`);
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedGenerate = async (e) => {
    e.preventDefault();
    
    if (!advancedForm.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    setLoading(true);
    try {
      const quiz = await quizAPI.generateQuiz({
        type: 'advanced',
        ...advancedForm,
        subtopics: advancedForm.subtopics.filter(s => s.trim()),
        focusAreas: advancedForm.focusAreas.filter(f => f.trim()),
        learningObjectives: advancedForm.learningObjectives.filter(l => l.trim()),
        excludeTopics: advancedForm.excludeTopics.filter(e => e.trim()),
      });
      
      toast.success('Quiz generated successfully!');
      navigate(`/quiz?id=${quiz.id}`);
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadGenerate = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.content.trim() && !uploadForm.url.trim() && !uploadForm.file) {
      toast.error('Please provide content, URL, or upload a file');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', 'upload');
      formData.append('difficulty', uploadForm.difficulty);
      formData.append('questionCount', uploadForm.questionCount);
      formData.append('timeLimit', uploadForm.timeLimit);
      
      if (uploadForm.content.trim()) {
        formData.append('content', uploadForm.content);
      }
      if (uploadForm.url.trim()) {
        formData.append('url', uploadForm.url);
      }
      if (uploadForm.file) {
        formData.append('file', uploadForm.file);
      }
      
      const quiz = await quizAPI.generateQuizFromUpload(formData);
      
      toast.success('Quiz generated successfully!');
      navigate(`/quiz?id=${quiz.id}`);
    } catch (error) {
      toast.error('Failed to generate quiz from upload');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    try {
      const templateData = activeTab === 'quick' ? quickForm : advancedForm;
      await quizAPI.saveTemplate({
        name: templateName,
        type: activeTab,
        data: templateData,
      });
      
      toast.success('Template saved successfully!');
      setShowSaveModal(false);
      setTemplateName('');
      if (activeTab === 'saved') {
        fetchSavedTemplates();
      }
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleLoadTemplate = (template) => {
    if (template.type === 'quick') {
      setQuickForm(template.data);
      setActiveTab('quick');
    } else {
      setAdvancedForm(template.data);
      setActiveTab('advanced');
    }
    toast.success('Template loaded successfully!');
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await quizAPI.deleteTemplate(templateId);
      toast.success('Template deleted successfully!');
      fetchSavedTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const addArrayField = (form, setForm, field) => {
    setForm({
      ...form,
      [field]: [...form[field], ''],
    });
  };

  const updateArrayField = (form, setForm, field, index, value) => {
    const newArray = [...form[field]];
    newArray[index] = value;
    setForm({
      ...form,
      [field]: newArray,
    });
  };

  const removeArrayField = (form, setForm, field, index) => {
    setForm({
      ...form,
      [field]: form[field].filter((_, i) => i !== index),
    });
  };

  const tabs = [
    { id: 'quick', label: 'Quick Generate', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'upload', label: 'From Content', icon: Upload },
    { id: 'saved', label: 'Saved Templates', icon: Save },
  ];

  const renderQuickTab = () => (
    <form onSubmit={handleQuickGenerate} className="space-y-6">
      <div>
        <label className="label">
          Topic *
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g., World War II, Photosynthesis, JavaScript Basics"
          value={quickForm.topic}
          onChange={(e) => setQuickForm({ ...quickForm, topic: e.target.value })}
          required
        />
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Enter any topic you'd like to create a quiz about
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="label">
            Difficulty
          </label>
          <select
            className="input"
            value={quickForm.difficulty}
            onChange={(e) => setQuickForm({ ...quickForm, difficulty: e.target.value })}
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">
            Number of Questions
          </label>
          <select
            className="input"
            value={quickForm.questionCount}
            onChange={(e) => setQuickForm({ ...quickForm, questionCount: parseInt(e.target.value) })}
          >
            {[5, 10, 15, 20, 25, 30].map((count) => (
              <option key={count} value={count}>
                {count} questions
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">
            Time Limit (minutes)
          </label>
          <select
            className="input"
            value={quickForm.timeLimit}
            onChange={(e) => setQuickForm({ ...quickForm, timeLimit: parseInt(e.target.value) })}
          >
            {[5, 10, 15, 20, 30, 45, 60].map((time) => (
              <option key={time} value={time}>
                {time} minutes
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          className="btn-outline flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Template
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Quiz
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderAdvancedTab = () => (
    <form onSubmit={handleAdvancedGenerate} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">
            Main Topic *
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Machine Learning"
            value={advancedForm.topic}
            onChange={(e) => setAdvancedForm({ ...advancedForm, topic: e.target.value })}
            required
          />
        </div>
        
        <div>
          <label className="label">
            Language
          </label>
          <select
            className="input"
            value={advancedForm.language}
            onChange={(e) => setAdvancedForm({ ...advancedForm, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="label">
          Subtopics
        </label>
        {advancedForm.subtopics.map((subtopic, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g., Neural Networks, Decision Trees"
              value={subtopic}
              onChange={(e) => updateArrayField(advancedForm, setAdvancedForm, 'subtopics', index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeArrayField(advancedForm, setAdvancedForm, 'subtopics', index)}
              className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField(advancedForm, setAdvancedForm, 'subtopics')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          + Add Subtopic
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="label">
            Difficulty
          </label>
          <select
            className="input"
            value={advancedForm.difficulty}
            onChange={(e) => setAdvancedForm({ ...advancedForm, difficulty: e.target.value })}
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">
            Questions
          </label>
          <select
            className="input"
            value={advancedForm.questionCount}
            onChange={(e) => setAdvancedForm({ ...advancedForm, questionCount: parseInt(e.target.value) })}
          >
            {[5, 10, 15, 20, 25, 30, 40, 50].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">
            Time Limit
          </label>
          <select
            className="input"
            value={advancedForm.timeLimit}
            onChange={(e) => setAdvancedForm({ ...advancedForm, timeLimit: parseInt(e.target.value) })}
          >
            {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((time) => (
              <option key={time} value={time}>
                {time}m
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">
            Complexity
          </label>
          <select
            className="input"
            value={advancedForm.complexity}
            onChange={(e) => setAdvancedForm({ ...advancedForm, complexity: e.target.value })}
          >
            {complexityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="label">
          Question Types
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {questionTypes.map((type) => (
            <label key={type.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={advancedForm.questionTypes.includes(type.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAdvancedForm({
                      ...advancedForm,
                      questionTypes: [...advancedForm.questionTypes, type.value],
                    });
                  } else {
                    setAdvancedForm({
                      ...advancedForm,
                      questionTypes: advancedForm.questionTypes.filter(t => t !== type.value),
                    });
                  }
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">
            Focus Areas
          </label>
          {advancedForm.focusAreas.map((area, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="e.g., Problem-solving, Theory"
                value={area}
                onChange={(e) => updateArrayField(advancedForm, setAdvancedForm, 'focusAreas', index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeArrayField(advancedForm, setAdvancedForm, 'focusAreas', index)}
                className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField(advancedForm, setAdvancedForm, 'focusAreas')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            + Add Focus Area
          </button>
        </div>
        
        <div>
          <label className="label">
            Learning Objectives
          </label>
          {advancedForm.learningObjectives.map((objective, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="e.g., Understand core concepts"
                value={objective}
                onChange={(e) => updateArrayField(advancedForm, setAdvancedForm, 'learningObjectives', index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeArrayField(advancedForm, setAdvancedForm, 'learningObjectives', index)}
                className="p-2 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField(advancedForm, setAdvancedForm, 'learningObjectives')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            + Add Learning Objective
          </button>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          className="btn-outline flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Template
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Advanced Quiz
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderUploadTab = () => (
    <form onSubmit={handleUploadGenerate} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <div>
              <label className="label flex items-center">
                <Type className="w-4 h-4 mr-2" />
                Paste Content
              </label>
              <textarea
                className="input"
                rows={8}
                placeholder="Paste your text content here (articles, notes, textbook chapters, etc.)"
                value={uploadForm.content}
                onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
              />
            </div>
            
            <div className="text-center text-gray-500 dark:text-gray-400">
              OR
            </div>
            
            <div>
              <label className="label flex items-center">
                <Link className="w-4 h-4 mr-2" />
                URL
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/article"
                value={uploadForm.url}
                onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Enter a URL to generate quiz from web content
              </p>
            </div>
            
            <div className="text-center text-gray-500 dark:text-gray-400">
              OR
            </div>
            
            <div>
              <label className="label flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT files
                  </p>
                </label>
                {uploadForm.file && (
                  <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                    Selected: {uploadForm.file.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quiz Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  Difficulty
                </label>
                <select
                  className="input"
                  value={uploadForm.difficulty}
                  onChange={(e) => setUploadForm({ ...uploadForm, difficulty: e.target.value })}
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">
                  Questions
                </label>
                <select
                  className="input"
                  value={uploadForm.questionCount}
                  onChange={(e) => setUploadForm({ ...uploadForm, questionCount: parseInt(e.target.value) })}
                >
                  {[5, 10, 15, 20, 25, 30].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">
                  Time Limit
                </label>
                <select
                  className="input"
                  value={uploadForm.timeLimit}
                  onChange={(e) => setUploadForm({ ...uploadForm, timeLimit: parseInt(e.target.value) })}
                >
                  {[10, 15, 20, 30, 45, 60].map((time) => (
                    <option key={time} value={time}>
                      {time}m
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6 flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate from Content
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  const renderSavedTab = () => (
    <div className="space-y-6">
      {savedTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.type === 'quick' ? 'Quick' : 'Advanced'} • {template.data.topic}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLoadTemplate(template)}
                    className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                    title="Load template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <span className="capitalize">{template.data.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span>{template.data.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{template.data.timeLimit}m</span>
                </div>
              </div>
              
              <button
                onClick={() => handleLoadTemplate(template)}
                className="btn-outline w-full mt-4"
              >
                Load Template
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Save className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Saved Templates
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Save your quiz configurations as templates for quick reuse.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>AI Quiz Generator - AdaptiveExam</title>
        <meta name="description" content="Generate personalized quizzes using AI technology." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Quiz Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create personalized quizzes instantly using advanced AI. Generate from topics, upload content, or use saved templates.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2"
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

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          {activeTab === 'quick' && renderQuickTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
          {activeTab === 'upload' && renderUploadTab()}
          {activeTab === 'saved' && renderSavedTab()}
        </motion.div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Template
            </h3>
            
            <div className="mb-6">
              <label className="label">
                Template Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g., My Science Quiz Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName('');
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="btn-primary flex-1"
              >
                Save Template
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AIGenerate;