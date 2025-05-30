import React, { useState } from 'react';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './AuthForm.css';

function AuthForm() {
  const { login, register, error, clearError } = useLearningBuddy();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    gradeLevel: 'elementary',
    subjects: [],
    techComfort: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectsChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, value]
        : prev.subjects.filter(subject => subject !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (!result.success) {
        console.error('Auth failed:', result.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setFormData({
      email: '',
      password: '',
      name: '',
      gradeLevel: 'elementary',
      subjects: [],
      techComfort: 'medium'
    });
  };

  const subjectOptions = [
    'Math', 'Science', 'English/Language Arts', 'Social Studies',
    'Art', 'Music', 'Physical Education', 'Technology', 'Other'
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            🤖 <span>AI Learning Buddy</span>
          </div>
          <h2>{isLogin ? 'Welcome Back!' : 'Join Us!'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Continue your AI literacy journey'
              : 'Start your personalized AI learning experience'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Registration fields */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gradeLevel">Grade Level You Teach</label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="elementary">Elementary (K-5)</option>
                  <option value="middle">Middle School (6-8)</option>
                  <option value="high">High School (9-12)</option>
                  <option value="mixed">Multiple Grade Levels</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subjects You Teach (Select all that apply)</label>
                <div className="checkbox-grid">
                  {subjectOptions.map(subject => (
                    <label key={subject} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={subject}
                        checked={formData.subjects.includes(subject)}
                        onChange={handleSubjectsChange}
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="techComfort">Technology Comfort Level</label>
                <select
                  id="techComfort"
                  name="techComfort"
                  value={formData.techComfort}
                  onChange={handleInputChange}
                >
                  <option value="low">Beginner - I prefer simple, step-by-step guidance</option>
                  <option value="medium">Intermediate - I'm comfortable with most tech tools</option>
                  <option value="high">Advanced - I love exploring new technologies</option>
                </select>
              </div>
            </>
          )}

          {/* Common fields */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
            {!isLogin && (
              <div className="form-hint">
                Password must be at least 6 characters long
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="link-button"
              onClick={toggleMode}
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>

        {!isLogin && (
          <div className="privacy-notice">
            <p>
              🔒 Your data is secure and will only be used to personalize your learning experience.
              We never share your information with third parties.
            </p>
          </div>
        )}
      </div>

      {/* Feature preview for non-authenticated users */}
      <div className="feature-preview">
        <h3>What You'll Get:</h3>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <div>
              <strong>Personalized Learning</strong>
              <p>AI that adapts to your grade level, subjects, and tech comfort</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <div>
              <strong>Interactive Conversations</strong>
              <p>Ask questions, get examples, and explore AI concepts through chat</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div>
              <strong>Progress Tracking</strong>
              <p>See your learning journey and celebrate achievements</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎓</span>
            <div>
              <strong>Practical Applications</strong>
              <p>Learn how to integrate AI tools into your actual teaching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
