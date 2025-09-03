'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  contentUrl?: string;
  videoId?: string;
  duration?: string;
  description?: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  contentItems?: ContentItem[];
}

interface Module {
  id: string; 
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  modules?: Module[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    // Set first available content as default when course loads
    if (course && course.modules && course.modules.length > 0) {
      const firstModule = course.modules[0];
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0];
        setCurrentLesson(firstLesson);
        
        if (firstLesson.contentItems && firstLesson.contentItems.length > 0) {
          setCurrentContent(firstLesson.contentItems[0]);
        }
      }
    }
    
    // Initial greeting message
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: `👋 Hi! I'm your AI Learning Buddy. I'm here to help you understand the concepts in "${course?.title || 'this course'}" and how to apply them. Select a lesson to get started!`,
      timestamp: new Date(),
    }]);
  }, [course]);

  // Update greeting when lesson changes
  useEffect(() => {
    if (currentLesson && messages.length === 1 && messages[0].id === 'greeting') {
      setMessages([{
        id: 'greeting-updated',
        role: 'assistant',
        content: `👋 Hi! I'm your AI Learning Buddy. I see you're learning about "${currentLesson.title}". ${
          currentContent?.type === 'video' && currentContent?.videoId 
            ? "I have context about this content, so feel free to ask about any specific part!" 
            : "Feel free to ask me anything about it!"
        }`,
        timestamp: new Date(),
      }]);
    }
  }, [currentLesson, currentContent]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please log in to access course content');
      }
      
      const response = await axios.get(`http://localhost:3001/api/cms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCourse(response.data);
    } catch (err: any) {
      console.error('Error fetching course:', err);
      if (err.response?.status === 404) {
        setError('Course not found');
      } else if (err.response?.status === 401) {
        setError('Please log in to access this course');
      } else {
        setError(err.message || 'Failed to load course');
      }
    } finally {
      setLoading(false);
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const selectContent = (lesson: Lesson, contentItem?: ContentItem) => {
    setCurrentLesson(lesson);
    if (contentItem) {
      setCurrentContent(contentItem);
    } else if (lesson.contentItems && lesson.contentItems.length > 0) {
      setCurrentContent(lesson.contentItems[0]);
    } else {
      setCurrentContent(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      if (!userId) {
        throw new Error('No user ID found - please login again');
      }
      
      const response = await axios.post(
        'http://localhost:3001/api/chat',
        {
          message: input,
          userId: userId,
          context: {
            courseId: courseId,
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            contentId: currentContent?.id,
            contentTitle: currentContent?.title,
            contentType: currentContent?.type,
            videoId: currentContent?.videoId,
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
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Can you explain this concept?",
    "How can I apply this in my classroom?",
    "What are the key takeaways?"
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
              {error.includes('log in') && (
                <button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
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
          
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <div key={module.id} className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">
                  Module {module.order}: {module.title}
                </h3>
                
                {module.lessons && module.lessons.length > 0 ? (
                  <div className="space-y-1">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id}>
                        <button
                          onClick={() => selectContent(lesson)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            currentLesson?.id === lesson.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="text-sm">{lesson.title}</div>
                            {lesson.contentItems && lesson.contentItems.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {lesson.contentItems.length} item{lesson.contentItems.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </button>
                        
                        {/* Show content items for current lesson */}
                        {currentLesson?.id === lesson.id && lesson.contentItems && lesson.contentItems.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {lesson.contentItems.map((content) => (
                              <button
                                key={content.id}
                                onClick={() => setCurrentContent(content)}
                                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                  currentContent?.id === content.id
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'hover:bg-gray-100 text-gray-500'
                                }`}
                              >
                                {content.type === 'video' ? '🎥' : content.type === 'text' ? '📄' : '📎'} {content.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 ml-3">No lessons yet</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No modules available</p>
          )}
        </div>

        {/* Center - Content Viewer */}
        <div className={`flex-1 overflow-hidden ${isChatOpen ? '' : 'mr-0'}`}>
          {currentContent ? (
            <div className="h-full flex flex-col bg-gray-50">
              {/* Content Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-2xl font-semibold text-gray-900">{currentContent.title}</h2>
                <p className="text-gray-600 mt-1">{currentContent.description || currentLesson?.description}</p>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {currentContent.type === 'video' && (
                  <div className="w-full h-full bg-black flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentContent.videoId || getYouTubeId(currentContent.contentUrl || '')}`}
                        title={currentContent.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
                
                {currentContent.type === 'text' && (
                  <div className="p-8 bg-white overflow-y-auto h-full">
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{currentContent.description || 'Text content will be displayed here...'}</p>
                    </div>
                  </div>
                )}

                {currentContent.type === 'pdf' && (
                  <div className="p-8 bg-white text-center">
                    <p className="text-gray-600 mb-4">PDF content: {currentContent.title}</p>
                    <p className="text-sm text-gray-500">PDF viewer will be implemented here</p>
                  </div>
                )}

                {!['video', 'text', 'pdf'].includes(currentContent.type) && (
                  <div className="p-8 bg-white text-center">
                    <p className="text-gray-600">Content type: {currentContent.type}</p>
                    <p className="text-sm text-gray-500 mt-2">Content viewer for {currentContent.type} will be implemented</p>
                  </div>
                )}
              </div>
            </div>
          ) : currentLesson ? (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{currentLesson.title}</h2>
                <p className="text-gray-600 mb-4">{currentLesson.description}</p>
                <p className="text-gray-500">No content items available for this lesson</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a lesson to begin
            </div>
          )}
        </div>

        {/* Right Panel - AI Chat */}
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
              
              {chatLoading && (
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
                  disabled={chatLoading}
                />
                <button 
                  onClick={sendMessage}
                  disabled={chatLoading || !input.trim()}
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