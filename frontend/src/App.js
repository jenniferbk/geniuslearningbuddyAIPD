import React, { useEffect } from 'react';
import { LearningBuddyProvider, useLearningBuddy } from './context/LearningBuddyContext';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import ProgressDashboard from './components/ProgressDashboard';
import AuthForm from './components/AuthForm';
import ModulesView from './components/ModulesView';
import './App.css';

// Main app content (inside the provider)
function AppContent() {
  const { 
    isAuthenticated, 
    currentView, 
    notifications, 
    error,
    clearError,
    dispatch
  } = useLearningBuddy();

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Auto-remove notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', id: notifications[0].id });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, dispatch]);

  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface />;
      case 'progress':
        return <ProgressDashboard />;
      case 'modules':
        return <ModulesView />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        {renderCurrentView()}
      </main>
      
      {/* Global Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification ${notification.type}`}
            >
              <span className="notification-icon">
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'info' && 'ℹ️'}
                {notification.type === 'warning' && '⚠️'}
              </span>
              <span className="notification-message">{notification.message}</span>
              <button 
                className="notification-close"
                onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', id: notification.id })}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Global Error Display */}
      {error && (
        <div className="error-overlay">
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="error-dismiss" onClick={clearError}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App component with provider
function App() {
  return (
    <LearningBuddyProvider>
      <AppContent />
    </LearningBuddyProvider>
  );
}

export default App;
