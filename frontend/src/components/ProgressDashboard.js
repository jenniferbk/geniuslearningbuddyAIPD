import React, { useEffect } from 'react';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './ProgressDashboard.css';

function ProgressDashboard() {
  const {
    user,
    learningProgress,
    fetchUserProgress,
    memoryUpdates
  } = useLearningBuddy();
  
  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);
  
  if (!user) {
    return <div className="progress-loading">Loading progress...</div>;
  }
  
  const progress = learningProgress.basic_ai_literacy;
  const completionPercentage = Math.round(progress.completion * 100);
  
  const getProgressColor = (percentage) => {
    if (percentage < 25) return '#ff6b6b';
    if (percentage < 50) return '#feca57';
    if (percentage < 75) return '#48dbfb';
    return '#0be881';
  };
  
  const getEncouragementMessage = (percentage) => {
    if (percentage === 0) return "Ready to begin your AI literacy journey! 🚀";
    if (percentage < 25) return "Great start! Keep exploring and asking questions. 💪";
    if (percentage < 50) return "You're making excellent progress! 🌟";
    if (percentage < 75) return "Almost there! You're becoming an AI-savvy educator. 🎯";
    if (percentage < 100) return "So close to mastering the basics! 🏆";
    return "Congratulations! You've completed Basic AI Literacy! 🎉";
  };
  
  const getLearningTopics = () => [
    { id: 'what_is_ai', name: 'What is AI?', status: getTopicStatus('what_is_ai') },
    { id: 'types_of_ai', name: 'Types of AI Tools', status: getTopicStatus('types_of_ai') },
    { id: 'ai_in_education', name: 'AI in Education', status: getTopicStatus('ai_in_education') },
    { id: 'ethics_and_bias', name: 'Ethics & Bias', status: getTopicStatus('ethics_and_bias') },
    { id: 'hands_on_practice', name: 'Hands-on Practice', status: getTopicStatus('hands_on_practice') }
  ];
  
  const getTopicStatus = (topicId) => {
    if (progress.currentTopic === topicId) return 'current';
    
    // Simple heuristic based on completion percentage
    const topicOrder = ['what_is_ai', 'types_of_ai', 'ai_in_education', 'ethics_and_bias', 'hands_on_practice'];
    const currentIndex = topicOrder.indexOf(progress.currentTopic);
    const topicIndex = topicOrder.indexOf(topicId);
    
    if (topicIndex < currentIndex) return 'completed';
    if (topicIndex === currentIndex) return 'current';
    return 'upcoming';
  };
  
  const getRecentAchievements = () => {
    const achievements = [];
    
    if (completionPercentage >= 10) achievements.push('Started learning about AI 🎯');
    if (completionPercentage >= 25) achievements.push('Explored AI tool types 🛠️');
    if (completionPercentage >= 50) achievements.push('Discussed AI in education 🏫');
    if (completionPercentage >= 75) achievements.push('Learned about AI ethics 🤔');
    if (completionPercentage >= 90) achievements.push('Practiced with AI tools 💻');
    
    return achievements.slice(-3); // Show last 3 achievements
  };
  
  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>Your Learning Progress</h2>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.gradeLevel} Teacher</span>
        </div>
      </div>
      
      {/* Main Progress Circle */}
      <div className="progress-overview">
        <div className="progress-circle-container">
          <div className="progress-circle">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e1e5e9"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getProgressColor(completionPercentage)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress.completion)}`}
                transform="rotate(-90 100 100)"
                className="progress-stroke"
              />
            </svg>
            <div className="progress-text">
              <div className="progress-percentage">{completionPercentage}%</div>
              <div className="progress-label">Complete</div>
            </div>
          </div>
        </div>
        
        <div className="progress-details">
          <h3>Basic AI Literacy</h3>
          <p className="encouragement-message">
            {getEncouragementMessage(completionPercentage)}
          </p>
          <div className="current-topic">
            <strong>Current Focus:</strong> {progress.currentTopic?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
      </div>
      
      {/* Learning Topics */}
      <div className="learning-topics">
        <h3>Learning Topics</h3>
        <div className="topics-list">
          {getLearningTopics().map((topic) => (
            <div key={topic.id} className={`topic-item ${topic.status}`}>
              <div className="topic-status-icon">
                {topic.status === 'completed' && '✅'}
                {topic.status === 'current' && '🎯'}
                {topic.status === 'upcoming' && '⏳'}
              </div>
              <span className="topic-name">{topic.name}</span>
              <span className="topic-status-text">{topic.status}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Achievements */}
      {getRecentAchievements().length > 0 && (
        <div className="achievements">
          <h3>Recent Achievements</h3>
          <div className="achievements-list">
            {getRecentAchievements().map((achievement, index) => (
              <div key={index} className="achievement-item">
                {achievement}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Memory Updates */}
      {memoryUpdates.length > 0 && (
        <div className="memory-updates">
          <h3>What I Remember About You</h3>
          <div className="memory-list">
            {memoryUpdates.slice(-5).map((update, index) => (
              <div key={index} className="memory-item">
                💭 {update}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Next Steps */}
      <div className="next-steps">
        <h3>Next Steps</h3>
        <div className="next-steps-content">
          {completionPercentage < 100 ? (
            <p>
              Continue exploring the current topic through conversation with your Learning Buddy. 
              Ask questions, request examples, or discuss how these concepts apply to your teaching.
            </p>
          ) : (
            <div>
              <p>🎉 Congratulations on completing Basic AI Literacy!</p>
              <p>Ready for advanced modules:</p>
              <ul>
                <li>AI-Enhanced Lesson Planning</li>
                <li>AI in Student Assessment</li>
                <li>AI in STEM Classrooms</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Learning Statistics */}
      <div className="learning-stats">
        <h3>Learning Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{memoryUpdates.length}</div>
            <div className="stat-label">Topics Explored</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{progress.lastInteraction ? 
              Math.ceil((new Date() - new Date(progress.lastInteraction)) / (1000 * 60 * 60 * 24)) : 0}</div>
            <div className="stat-label">Days Since Last Session</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{Math.max(1, Math.ceil(completionPercentage / 10))}</div>
            <div className="stat-label">Learning Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressDashboard;
