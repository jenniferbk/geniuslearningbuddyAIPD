import React, { useState, useEffect } from 'react';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './ModulesView.css';

function ModulesView() {
  const { user, learningProgress } = useLearningBuddy();
  const [selectedModule, setSelectedModule] = useState('basic_ai_literacy');
  const [moduleContent, setModuleContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading module content
    setLoading(true);
    setTimeout(() => {
      // Mock module data - in real implementation, this would come from API
      setModuleContent({
        id: 'basic_ai_literacy',
        name: 'Basic AI Literacy for Educators',
        description: 'Foundational understanding of AI technologies and their educational applications',
        estimatedDuration: '4-6 hours',
        topics: [
          {
            id: 'what_is_ai',
            name: 'What is Artificial Intelligence?',
            description: 'Basic concepts and definitions',
            status: getTopicStatus('what_is_ai'),
            keyPoints: [
              'AI as computer systems that can perform tasks typically requiring human intelligence',
              'Difference between AI, machine learning, and automation',
              'How AI systems learn from data',
              'Common AI applications in daily life'
            ]
          },
          {
            id: 'types_of_ai',
            name: 'Types of AI Tools',
            description: 'Overview of different AI categories and applications',
            status: getTopicStatus('types_of_ai'),
            keyPoints: [
              'Text generation (like ChatGPT)',
              'Image creation and analysis',
              'Voice and speech recognition',
              'Educational AI tutors and assistants'
            ]
          },
          {
            id: 'ai_in_education',
            name: 'AI in Educational Settings',
            description: 'Benefits, challenges, and practical applications',
            status: getTopicStatus('ai_in_education'),
            keyPoints: [
              'Personalized learning opportunities',
              'Administrative task automation',
              'Content creation and adaptation',
              'Assessment and feedback support'
            ]
          },
          {
            id: 'ethics_and_bias',
            name: 'AI Ethics and Bias',
            description: 'Critical considerations for responsible AI use',
            status: getTopicStatus('ethics_and_bias'),
            keyPoints: [
              'Understanding algorithmic bias',
              'Importance of diverse training data',
              'Transparency and explainability',
              'Student privacy considerations'
            ]
          },
          {
            id: 'hands_on_practice',
            name: 'Hands-on AI Practice',
            description: 'Guided practice with AI tools',
            status: getTopicStatus('hands_on_practice'),
            keyPoints: [
              'Learn to write effective prompts',
              'Practice with AI text generation',
              'Critically assess AI-generated content',
              'Apply AI tools to teaching tasks'
            ]
          }
        ]
      });
      setLoading(false);
    }, 500);
  }, [selectedModule]);

  const getTopicStatus = (topicId) => {
    const progress = learningProgress.basic_ai_literacy;
    if (!progress) return 'upcoming';
    
    if (progress.currentTopic === topicId) return 'current';
    
    // Simple heuristic based on completion percentage
    const topicOrder = ['what_is_ai', 'types_of_ai', 'ai_in_education', 'ethics_and_bias', 'hands_on_practice'];
    const currentIndex = topicOrder.indexOf(progress.currentTopic);
    const topicIndex = topicOrder.indexOf(topicId);
    
    if (topicIndex < currentIndex || progress.completion >= (topicIndex + 1) * 0.2) return 'completed';
    if (topicIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'current': return '🎯';
      case 'upcoming': return '⏳';
      default: return '⏳';
    }
  };

  const getCompletionPercentage = () => {
    if (!learningProgress.basic_ai_literacy) return 0;
    return Math.round(learningProgress.basic_ai_literacy.completion * 100);
  };

  if (loading) {
    return (
      <div className="modules-view">
        <div className="loading">
          Loading module content...
        </div>
      </div>
    );
  }

  return (
    <div className="modules-view">
      <div className="modules-header">
        <h1>Learning Modules</h1>
        <p>Explore structured learning content and track your progress through each topic.</p>
      </div>

      <div className="modules-content">
        {/* Module Overview Card */}
        <div className="module-overview">
          <div className="module-header">
            <h2>{moduleContent.name}</h2>
            <div className="module-meta">
              <span className="duration">⏱️ {moduleContent.estimatedDuration}</span>
              <span className="completion">{getCompletionPercentage()}% Complete</span>
            </div>
          </div>
          
          <p className="module-description">{moduleContent.description}</p>
          
          <div className="module-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="topics-container">
          <h3>Learning Topics</h3>
          <div className="topics-grid">
            {moduleContent.topics.map((topic, index) => (
              <div key={topic.id} className={`topic-card ${topic.status}`}>
                <div className="topic-header">
                  <span className="topic-number">{index + 1}</span>
                  <span className="topic-status">{getStatusIcon(topic.status)}</span>
                </div>
                
                <div className="topic-content">
                  <h4>{topic.name}</h4>
                  <p className="topic-description">{topic.description}</p>
                  
                  <div className="key-points">
                    <strong>Key Learning Points:</strong>
                    <ul>
                      {topic.keyPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                      {topic.keyPoints.length > 3 && (
                        <li className="more-points">...and {topic.keyPoints.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="topic-footer">
                  <span className={`status-badge ${topic.status}`}>
                    {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="coming-soon">
          <h3>Coming Soon</h3>
          <div className="future-modules">
            <div className="future-module">
              <h4>🎯 AI-Enhanced Lesson Planning</h4>
              <p>Learn to use AI tools for creating engaging lesson plans and educational content.</p>
              <span className="prerequisite">Requires: Basic AI Literacy completion</span>
            </div>
            
            <div className="future-module">
              <h4>📊 AI in Student Assessment</h4>
              <p>Explore AI applications for grading, feedback, and learning analytics.</p>
              <span className="prerequisite">Requires: Basic AI Literacy completion</span>
            </div>
            
            <div className="future-module">
              <h4>🔬 AI in STEM Classrooms</h4>
              <p>Subject-specific AI tools and applications for science and mathematics education.</p>
              <span className="prerequisite">Requires: Lesson Planning module completion</span>
            </div>
          </div>
        </div>

        {/* Learning Tips */}
        <div className="learning-tips">
          <h3>💡 Learning Tips</h3>
          <div className="tips-list">
            <div className="tip">
              <strong>Chat with your Learning Buddy:</strong> The best way to learn is through conversation. Ask questions about any topic you're curious about!
            </div>
            <div className="tip">
              <strong>Practice hands-on:</strong> Try the AI tools and techniques as you learn about them. Real experience builds confidence.
            </div>
            <div className="tip">
              <strong>Connect to your teaching:</strong> Think about how each concept applies to your specific grade level and subjects.
            </div>
            <div className="tip">
              <strong>Take your time:</strong> There's no rush! Learning is most effective when you can reflect on and apply new concepts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModulesView;
