import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// State management for the Learning Buddy app
const LearningBuddyContext = createContext();

// Initial state
const initialState = {
  // User authentication
  user: null,
  isAuthenticated: false,
  authToken: localStorage.getItem('authToken'),
  
  // Current conversation
  conversation: [],
  isTyping: false,
  currentModule: 'basic_ai_literacy',
  
  // Learning progress
  learningProgress: {
    basic_ai_literacy: { 
      completion: 0, 
      currentTopic: 'what_is_ai',
      competencies: {},
      lastInteraction: null
    }
  },
  
  // UI state
  currentView: 'chat', // 'chat', 'progress', 'modules'
  notifications: [],
  error: null,
  
  // Memory context (what the AI remembers about this user)
  memoryUpdates: []
};

// Action types
const ActionTypes = {
  // Auth actions
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  
  // Chat actions
  ADD_USER_MESSAGE: 'ADD_USER_MESSAGE',
  ADD_AI_RESPONSE: 'ADD_AI_RESPONSE',
  SET_TYPING: 'SET_TYPING',
  LOAD_CONVERSATION_HISTORY: 'LOAD_CONVERSATION_HISTORY',
  
  // Progress actions
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  LOAD_PROGRESS: 'LOAD_PROGRESS',
  
  // UI actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Memory actions
  UPDATE_MEMORY: 'UPDATE_MEMORY'
};

// Reducer function (like your consensus algorithm but for UI state)
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOGIN_SUCCESS:
      localStorage.setItem('authToken', action.token);
      return {
        ...state,
        user: action.user,
        isAuthenticated: true,
        authToken: action.token,
        error: null
      };
      
    case ActionTypes.LOGOUT:
      localStorage.removeItem('authToken');
      return {
        ...initialState,
        authToken: null,
        isAuthenticated: false
      };
      
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.user,
        isAuthenticated: !!action.user
      };
      
    case ActionTypes.ADD_USER_MESSAGE:
      return {
        ...state,
        conversation: [...state.conversation, {
          role: 'user',
          content: action.message,
          timestamp: new Date().toISOString()
        }],
        isTyping: true,
        error: null
      };
      
    case ActionTypes.ADD_AI_RESPONSE:
      return {
        ...state,
        conversation: [...state.conversation, {
          role: 'assistant',
          content: action.response,
          timestamp: new Date().toISOString()
        }],
        isTyping: false,
        learningProgress: action.progressUpdate ? {
          ...state.learningProgress,
          [state.currentModule]: {
            ...state.learningProgress[state.currentModule],
            ...action.progressUpdate
          }
        } : state.learningProgress,
        memoryUpdates: action.memoryUpdates || state.memoryUpdates
      };
      
    case ActionTypes.SET_TYPING:
      return {
        ...state,
        isTyping: action.isTyping
      };
      
    case ActionTypes.LOAD_CONVERSATION_HISTORY:
      return {
        ...state,
        conversation: action.conversation
      };
      
    case ActionTypes.UPDATE_PROGRESS:
      return {
        ...state,
        learningProgress: {
          ...state.learningProgress,
          [action.moduleId]: {
            ...state.learningProgress[action.moduleId],
            ...action.progress
          }
        }
      };
      
    case ActionTypes.LOAD_PROGRESS:
      return {
        ...state,
        learningProgress: {
          ...state.learningProgress,
          [action.progress.moduleId]: action.progress
        }
      };
      
    case ActionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.view
      };
      
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          message: action.message,
          type: action.notificationType || 'info'
        }]
      };
      
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.error,
        isTyping: false
      };
      
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ActionTypes.UPDATE_MEMORY:
      return {
        ...state,
        memoryUpdates: [...state.memoryUpdates, ...action.updates]
      };
      
    default:
      return state;
  }
}

// Context Provider Component
export function LearningBuddyProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Set up axios defaults
  useEffect(() => {
    if (state.authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.authToken]);
  
  // Auto-login if token exists
  useEffect(() => {
    if (state.authToken && !state.isAuthenticated) {
      // Verify token is still valid
      fetchUserProgress().catch(() => {
        // Token invalid, logout
        dispatch({ type: ActionTypes.LOGOUT });
      });
    }
  }, []);
  
  // === AUTH FUNCTIONS ===
  
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        user: response.data.user,
        token: response.data.token
      });
      
      // Load user's progress after login
      await fetchUserProgress();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: ActionTypes.SET_ERROR, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        user: response.data.user,
        token: response.data.token
      });
      
      // Load initial progress
      await fetchUserProgress();
      
      dispatch({
        type: ActionTypes.ADD_NOTIFICATION,
        message: 'Welcome! Your learning journey starts now.',
        notificationType: 'success'
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: ActionTypes.SET_ERROR, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };
  
  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
  };
  
  // === CHAT FUNCTIONS ===
  
  const sendMessage = async (message) => {
    // Add user message immediately for responsive UI
    dispatch({ type: ActionTypes.ADD_USER_MESSAGE, message });
    
    try {
      const response = await axios.post('/api/chat', {
        message,
        moduleContext: state.currentModule
      });
      
      // Add AI response and update state
      dispatch({
        type: ActionTypes.ADD_AI_RESPONSE,
        response: response.data.response,
        progressUpdate: response.data.progressUpdate,
        memoryUpdates: response.data.memoryUpdates
      });
      
      // REMOVED: Intrusive memory update notifications
      // Memory updates now happen silently in the background, like the Primer
      // The AI will naturally reference what it's learned in future conversations
      
      // LOG INTERACTION FOR RESEARCH (silently)
      if (response.data.memoryUpdates && response.data.memoryUpdates.length > 0) {
        console.log('🧠 Memory Updates (Silent):', response.data.memoryUpdates);
        
        // Optional: Send to research logging endpoint
        try {
          await axios.post('/api/research/log-interaction', {
            userId: state.user?.id,
            userMessage: message,
            aiResponse: response.data.response,
            memoryUpdates: response.data.memoryUpdates,
            progressUpdate: response.data.progressUpdate,
            timestamp: new Date().toISOString(),
            sessionId: state.currentSession || 'anonymous'
          });
        } catch (logError) {
          // Fail silently - don't disrupt user experience for logging failures
          console.warn('Research logging failed:', logError);
        }
      }
      
      // PRIMER-LIKE ENHANCEMENT: Show subtle learning progress indicators
      if (response.data.progressUpdate && response.data.progressUpdate.completion > 0) {
        // Instead of intrusive popup, show a subtle indicator that fades away
        const progressMessage = `Learning progress: ${Math.round(response.data.progressUpdate.completion * 100)}% boost in ${response.data.progressUpdate.topic}`;
        
        // Add as a very brief, auto-dismissing notification
        const notificationId = Date.now();
        dispatch({
          type: ActionTypes.ADD_NOTIFICATION,
          message: progressMessage,
          notificationType: 'success'
        });
        
        // Auto-remove much faster (2 seconds instead of 5)
        setTimeout(() => {
          dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, id: notificationId });
        }, 2000);
      }
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      dispatch({ type: ActionTypes.SET_ERROR, error: errorMessage });
      
      // Add error message to conversation
      dispatch({
        type: ActionTypes.ADD_AI_RESPONSE,
        response: "I'm sorry, I'm having trouble right now. Please try again in a moment."
      });
    }
  };
  
  // === PROGRESS FUNCTIONS ===
  
  const fetchUserProgress = async () => {
    try {
      const response = await axios.get('/api/progress');
      dispatch({
        type: ActionTypes.LOAD_PROGRESS,
        progress: response.data
      });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };
  
  // === UI FUNCTIONS ===
  
  const setCurrentView = (view) => {
    dispatch({ type: ActionTypes.SET_CURRENT_VIEW, view });
  };
  
  const addNotification = (message, type = 'info') => {
    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      message,
      notificationType: type
    });
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, id: Date.now() });
    }, 5000);
  };
  
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };
  
  // === CONVERSATION HISTORY ===
  
  const loadConversationHistory = async () => {
    try {
      const response = await axios.get('/api/conversations');
      const allMessages = response.data
        .flatMap(conv => JSON.parse(conv.messages || '[]'))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      dispatch({
        type: ActionTypes.LOAD_CONVERSATION_HISTORY,
        conversation: allMessages
      });
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Auth functions
    login,
    register,
    logout,
    
    // Chat functions
    sendMessage,
    loadConversationHistory,
    
    // Progress functions
    fetchUserProgress,
    
    // UI functions
    setCurrentView,
    addNotification,
    clearError,
    
    // Direct dispatch for advanced usage
    dispatch
  };
  
  return (
    <LearningBuddyContext.Provider value={value}>
      {children}
    </LearningBuddyContext.Provider>
  );
}

// Custom hook to use the context
export function useLearningBuddy() {
  const context = useContext(LearningBuddyContext);
  if (!context) {
    throw new Error('useLearningBuddy must be used within a LearningBuddyProvider');
  }
  return context;
}

export default LearningBuddyContext;
