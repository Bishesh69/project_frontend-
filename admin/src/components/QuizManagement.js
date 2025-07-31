import React, { useState } from 'react';

const QuizManagement = () => {
  const [quizzes] = useState([
    { id: 1, title: 'JavaScript Basics', category: 'Programming', questions: 20, difficulty: 'Beginner', status: 'Published', created: '2024-01-15' },
    { id: 2, title: 'React Advanced', category: 'Programming', questions: 15, difficulty: 'Advanced', status: 'Draft', created: '2024-01-20' },
    { id: 3, title: 'HTML & CSS', category: 'Web Development', questions: 25, difficulty: 'Intermediate', status: 'Published', created: '2024-01-10' },
    { id: 4, title: 'Node.js Fundamentals', category: 'Backend', questions: 18, difficulty: 'Intermediate', status: 'Published', created: '2024-01-25' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
        <button className="btn-primary">
          Create New Quiz
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search quizzes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Categories</option>
            <option>Programming</option>
            <option>Web Development</option>
            <option>Backend</option>
            <option>Database</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Difficulty</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                quiz.status === 'Published' 
                  ? 'bg-green-100 text-green-800' 
                  : quiz.status === 'Draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {quiz.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{quiz.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Questions:</span>
                <span className="font-medium">{quiz.questions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Difficulty:</span>
                <span className={`font-medium ${
                  quiz.difficulty === 'Beginner' ? 'text-green-600' :
                  quiz.difficulty === 'Intermediate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {quiz.difficulty}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium">{quiz.created}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 btn-primary text-sm py-1">
                Edit
              </button>
              <button className="flex-1 btn-secondary text-sm py-1">
                Preview
              </button>
              <button className="px-3 py-1 text-red-600 hover:text-red-800 border border-red-300 rounded text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">56</div>
            <div className="text-sm text-gray-500">Total Quizzes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">42</div>
            <div className="text-sm text-gray-500">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">14</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">1,234</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizManagement;