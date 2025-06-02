import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLearningBuddy } from '../context/LearningBuddyContext';
import './ChatInterface.css';

function ChatInterface({ contentContext }) {
  const {
    conversation,
    isTyping,
    sendMessage,
    user,
    learningProgress,
    loadConversationHistory
  } = useLearningBuddy();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [lastSuggestion, setLastSuggestion] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isTyping]);
  
  // Load conversation history on mount
  useEffect(() => {
    if (user && conversation.length === 0) {
      loadConversationHistory();
    }
  }, [user]);
  
  // Check if this is user's first visit
  useEffect(() => {
    if (conversation.length > 0) {
      setIsFirstVisit(false);
    }
  }, [conversation]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle AI suggestions for timestamp jumps
  useEffect(() => {
    // Listen for AI suggestions from chat responses
    if (window.lastAiSuggestion && window.lastAiSuggestion !== lastSuggestion) {
      setLastSuggestion(window.lastAiSuggestion);
    }
  }, [conversation]);
  
  const handleSend = async () => {
    if (inputMessage.trim()) {
      // Include content context in the message
      const response = await sendMessage(inputMessage, contentContext);
      setInputMessage('');
      setIsFirstVisit(false);
      
      // Handle AI suggestions
      if (response?.suggestion?.action === 'jump_to_timestamp') {
        if (window.videoPlayerActions?.jumpToTimestamp) {
          window.videoPlayerActions.jumpToTimestamp(response.suggestion.timestamp);
        }
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const getWelcomeMessage = () => {
    if (!user) return '';
    
    const progress = learningProgress.basic_ai_literacy;
    const completion = Math.round(progress.completion * 100);
    
    if (contentContext) {
      return `Hi ${user.name}! 👋 I'm your AI Learning Buddy, and I can see you're viewing "${contentContext.chunk?.topic || 'course content'}". 

I'll watch along with you and help explain concepts, answer questions, and make connections to your teaching practice. What would you like to know about this content?`;
    }
    
    if (completion === 0) {
      return `Hi ${user.name}! 👋 I'm your AI Learning Buddy, here to help you develop AI literacy for your ${user.gradeLevel} classroom. 

Ready to start exploring how AI can enhance your teaching? What would you like to know first?`;
    } else {
      return `Welcome back, ${user.name}! 🎉 

You're ${completion}% through the Basic AI Literacy module. We were exploring "${progress.currentTopic}". Ready to continue your learning journey?`;
    }
  };
  
  const formatMessage = (content) => {
    // Use ReactMarkdown for proper markdown rendering
    return (
      <ReactMarkdown
        components={{
          // Custom styling for different elements
          p: ({children}) => <div className="message-paragraph">{children}</div>,
          ul: ({children}) => <ul className="message-list">{children}</ul>,
          ol: ({children}) => <ol className="message-numbered-list">{children}</ol>,
          li: ({children}) => <li className="message-list-item">{children}</li>,
          strong: ({children}) => <strong className="message-bold">{children}</strong>,
          em: ({children}) => <em className="message-italic">{children}</em>,
          code: ({children}) => <code className="message-code">{children}</code>,
          h1: ({children}) => <h3 className="message-heading">{children}</h3>,
          h2: ({children}) => <h4 className="message-subheading">{children}</h4>,
          h3: ({children}) => <h5 className="message-subheading">{children}</h5>
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };
  
  const getStarterQuestions = () => {
    if (contentContext && contentContext.chunk) {
      // Content-aware starter questions
      return [
        `Can you explain more about ${contentContext.chunk.topic}?`,
        "How does this apply to my classroom?",
        "What should I remember from this section?",
        "Can you give me an example of this concept?"
      ];
    }
    
    // Default starter questions
    return [
      "What exactly is artificial intelligence?",
      "How could AI help me in my classroom?",
      "What should I be concerned about with AI?",
      "Can you show me some examples of AI tools for teachers?"
    ];
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="buddy-avatar">🤖</div>
        <div className="header-info">
          <h2>AI Buddy</h2>
          <div className="module-info">
            Basic AI Literacy • {Math.round(learningProgress.basic_ai_literacy.completion * 100)}% Complete
            {contentContext && (
              <div className="content-awareness-indicator">
                🎬 Watching: {contentContext.chunk?.topic || 'Content'} 
                {contentContext.timestamp && (
                  <span className="timestamp">({formatTimestamp(contentContext.timestamp)})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="chat-messages">
        {/* Content context notification */}
        {contentContext && (
          <div className="content-context-notification">
            <div className="context-icon">🎯</div>
            <div className="context-message">
              I'm now watching the content with you and can reference what you're viewing in our conversation.
            </div>
          </div>
        )}

        {/* Welcome message for new users */}
        {isFirstVisit && conversation.length === 0 && (
          <div className="message assistant welcome-message">
            <div className="message-content">
              {formatMessage(getWelcomeMessage())}
              
              <div className="starter-questions">
                <p><strong>Here are some questions to get started:</strong></p>
                {getStarterQuestions().map((question, index) => (
                  <button
                    key={index}
                    className="starter-question"
                    onClick={() => {
                      setInputMessage(question);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
            <div className="message-timestamp">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
        
        {/* Existing conversation */}
        {conversation.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {formatMessage(message.content)}
              {/* Show content reference if available */}
              {message.contentReference && (
                <div className="content-reference">
                  🎯 Referenced: {message.contentReference.referencedContent}
                  {message.contentReference.timestamp && (
                    <span className="ref-timestamp">
                      ({formatTimestamp(message.contentReference.timestamp)})
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="typing-text">Learning Buddy is thinking...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              contentContext 
                ? "Ask me about what you're watching..." 
                : "Ask me anything about AI in education..."
            }
            rows={1}
            className="chat-input"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!inputMessage.trim() || isTyping}
            className="send-button"
          >
            {isTyping ? '⏳' : '📤'}
          </button>
        </div>
        
        <div className="input-help">
          Press Enter to send • Shift+Enter for new line
          {contentContext && (
            <span className="content-help">
              • AI can reference the video content you're watching
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;