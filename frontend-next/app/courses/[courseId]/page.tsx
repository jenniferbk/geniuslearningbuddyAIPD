'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Simple course data for testing
const courseData = {
  title: "AI Literacy for Educators",
  modules: [
    {
      id: "module-1", 
      title: "Understanding AI Fundamentals",
      order: 1,
      lessons: [
        {
          id: "lesson-1-1",
          title: "Google's AI Course for Educators",
          type: "video",
          contentUrl: "https://www.youtube.com/watch?v=p09yRj47kNM",
          videoId: "p09yRj47kNM",
          duration: "12:00",
          description: "Google's comprehensive introduction to AI for teachers",
          order: 1
        },
        {
          id: "lesson-1-2",
          title: "Types of AI: From Narrow to General",
          type: "reading",
          contentUrl: "/content/courses/ai-literacy-basics/readings/types-of-ai.md",
          duration: "10 min read",
          description: "Understanding different categories of AI systems",
          order: 2
        }
      ]
    }
  ]
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Full course interface with video player and chat
export default function CoursePage() {
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set first lesson as default
    if (courseData.modules[0]?.lessons[0]) {
      setCurrentLesson(courseData.modules[0].lessons[0]);
    }
    
    // Initial greeting message
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: `👋 Hi! I'm your AI Learning Buddy. I'm here to help you understand AI concepts and how to apply them in your classroom. Select a lesson to get started!`,
      timestamp: new Date(),
    }]);
  }, []);

  // Update greeting when lesson changes
  useEffect(() => {
    if (currentLesson && messages.length === 1 && messages[0].id === 'greeting') {
      setMessages([{
        id: 'greeting-updated',
        role: 'assistant',
        content: `👋 Hi! I'm your AI Learning Buddy. I see you're learning about "${currentLesson.title}". ${
          currentLesson.type === 'video' && currentLesson.videoId 
            ? "I have the full transcript of this video, so feel free to ask about any specific part!" 
            : "Feel free to ask me anything about it!"
        }`,
        timestamp: new Date(),
      }]);
    }
  }, [currentLesson]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get the stored token
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(
        'http://localhost:3001/api/chat',
        {
          message: input,
          userId: userId || 'test-user-123',
          context: {
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            lessonType: currentLesson?.type,
            videoId: currentLesson?.videoId,
            courseId: 'ai-literacy-basics',
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || 'I received your message but had trouble processing it.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I had trouble connecting to the AI service. ';
      
      if (error.message === 'Not authenticated' || error.response?.status === 401) {
        errorMessage = 'You need to sign in to use the chat. Click here to login: /auth';
      } else if (error.response?.status === 500) {
        errorMessage += 'The AI service encountered an error. Please try again.';
      } else if (!error.response) {
        errorMessage += 'Please make sure the backend server is running on port 3001.';
      }
      
      const errorResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What is prompt engineering?",
    "How can I use AI in my classroom?",
    "Explain this concept simply"
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Courses
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{courseData.title}</h1>
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isChatOpen ? 'Hide' : 'Show'} AI Buddy 🤖
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Course Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Course Content</h2>
          
          {courseData.modules.map((module) => (
            <div key={module.id} className="mb-6">
              <h3 className="font-medium text-gray-700 mb-2">
                Module {module.order}: {module.title}
              </h3>
              
              <div className="space-y-1">
                {module.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      currentLesson?.id === lesson.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm">{lesson.title}</div>
                      <div className="text-xs text-gray-500">{lesson.duration}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center - Content Viewer */}
        <div className={`flex-1 overflow-hidden ${isChatOpen ? '' : 'mr-0'}`}>
          {currentLesson ? (
            <div className="h-full flex flex-col bg-gray-50">
              {/* Content Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-2xl font-semibold text-gray-900">{currentLesson.title}</h2>
                <p className="text-gray-600 mt-1">{currentLesson.description}</p>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {currentLesson.type === 'video' && (
                  <div className="w-full h-full bg-black flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentLesson.videoId || getYouTubeId(currentLesson.contentUrl)}`}
                        title={currentLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
                
                {currentLesson.type === 'reading' && (
                  <div className="p-8 bg-white">
                    <p className="text-gray-600">Reading content will load here...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a lesson to begin
            </div>
          )}
        </div>

        {/* Right Panel - Working Chat */}
        {isChatOpen && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
              <h2 className="font-semibold">AI Learning Buddy</h2>
              {currentLesson && (
                <p className="text-xs text-blue-100 mt-1">
                  Discussing: {currentLesson.title}
                </p>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content.includes('/auth') ? (
                      <div className="text-sm">
                        <p>You need to sign in to use the chat.</p>
                        <a href="/auth" className="text-blue-600 underline font-semibold mt-1 inline-block">
                          → Click here to login
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about the lesson..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                  disabled={loading}
                />
                <button 
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}