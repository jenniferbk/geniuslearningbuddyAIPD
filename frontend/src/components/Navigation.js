import React from 'react';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './Navigation.css';

function Navigation() {
  const { 
    currentView, 
    setCurrentView, 
    user, 
    logout, 
    learningProgress 
  } = useLearningBuddy();

  if (!user) return null;

  const completionPercentage = Math.round(learningProgress.basic_ai_literacy.completion * 100);

  const navigationItems = [
    { id: 'chat', label: 'Chat', icon: '💬', description: 'Talk with your Learning Buddy' },
    { id: 'progress', label: 'Progress', icon: '📊', description: 'View your learning journey' },
    { id: 'modules', label: 'Modules', icon: '📚', description: 'Explore learning content' },
    { id: 'content-demo', label: 'Content Demo', icon: '🎬', description: 'Experience content-aware AI chat' },
    { id: 'courses', label: 'Create Courses', icon: '🎓', description: 'Create and manage course content' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <div className="nav-logo">
          🤖 <span>AI Buddy</span>
        </div>
        <div className="nav-user-info">
          <div className="user-welcome">
            <span className="user-name">{user.name}</span>
            <span className="user-progress">{completionPercentage}% Complete</span>
          </div>
        </div>
      </div>

      <div className="nav-items">
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            title={item.description}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-footer">
        <div className="progress-mini">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="progress-text">Basic AI Literacy</span>
        </div>
        
        <button className="logout-button" onClick={logout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </nav>
  );
}

export default Navigation;