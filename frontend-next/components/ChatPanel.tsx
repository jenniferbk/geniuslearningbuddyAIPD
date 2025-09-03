'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  currentLesson: any;
  courseId: string;
  contentProgress?: {
    timestamp?: number;
    page?: number;
    percentage?: number;
  };
}

export default function ChatPanel({ currentLesson, courseId, contentProgress }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: `👋 Hi! I'm your AI Learning Buddy. I'm here to help you understand AI concepts and how to apply them in your classroom. ${
        currentLesson ? `\n\nI see you're learning about "${currentLesson.title}". ${
          currentLesson.type === 'video' && currentLesson.videoId 
            ? "I have the full transcript of this video, so feel free to ask about any specific part!" 
            : "Feel free to ask me anything about it!"
        }` : 'Select a lesson to get started, and I\'ll be here to help!'
      }`,
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, [currentLesson]);

  const sendMessage = async () => {
    if (!input.trim()) return;

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
      // Get JWT token from localStorage (you'll need to implement auth first)
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
        {
          message: input,
          context: {
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            lessonType: currentLesson?.type,
            videoId: currentLesson?.videoId,
            courseId: courseId,
            timestamp: contentProgress?.timestamp,
            page: contentProgress?.page,
          }
        },
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          }
        }
      );

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // For now, provide a mock response that demonstrates transcript awareness
      const mockResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I understand you're asking about "${input}". ${
          currentLesson?.type === 'video' && contentProgress?.timestamp 
            ? `\n\nI see you're at ${Math.floor(contentProgress.timestamp / 60)}:${String(contentProgress.timestamp % 60).padStart(2, '0')} in the video. At this point, the instructor is discussing prompt engineering fundamentals. ` 
            : ''
        }${
          currentLesson?.videoId === 'p09yRj47kNM' 
            ? "This Google AI course video covers important concepts like prompt engineering, lesson planning with AI, and common mistakes to avoid. " 
            : ''
        }Let me help you understand this better. [Note: Backend connection pending - but transcript awareness will work when connected!]`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, mockResponse]);
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

  const getSuggestedQuestions = () => {
    if (!currentLesson) return [];
    
    if (currentLesson.type === 'video' && currentLesson.videoId === 'p09yRj47kNM') {
      // Google AI course specific questions
      if (contentProgress?.timestamp && contentProgress.timestamp < 120) {
        return [
          "What are the key principles of prompt engineering?",
          "How do I make my prompts more specific?",
          "Give me an example for 5th grade"
        ];
      } else if (contentProgress?.timestamp && contentProgress.timestamp < 275) {
        return [
          "What mistakes should I avoid?",
          "How do I specify the format I want?",
          "Show me a lesson plan prompt"
        ];
      } else {
        return [
          "How can I use this for differentiation?",
          "What about assessment creation?",
          "Explain the ethics considerations"
        ];
      }
    }
    
    // Default questions
    return [
      "How does this apply to my classroom?",
      "Can you give an example?",
      "Explain in simpler terms"
    ];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold">AI Learning Buddy</h2>
        </div>
        {currentLesson && (
          <p className="text-xs text-blue-100 mt-1">
            Discussing: {currentLesson.title}
            {contentProgress?.timestamp !== undefined && (
              <span className="ml-2">
                (at {Math.floor(contentProgress.timestamp / 60)}:{String(contentProgress.timestamp % 60).padStart(2, '0')})
              </span>
            )}
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
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
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the lesson..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 flex gap-2 flex-wrap">
          {getSuggestedQuestions().map((question, index) => (
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
  );
}