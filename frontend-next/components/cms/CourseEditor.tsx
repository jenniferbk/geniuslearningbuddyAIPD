'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, Save, X, 
  BookOpen, FileText, Clock, Target, MoveUp, MoveDown,
  GripVertical, Eye, Settings 
} from 'lucide-react';

interface LearningObjective {
  text: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  order_index: number;
  is_required: boolean;
  duration?: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  order_index: number;
  estimated_duration: number;
  lesson_type: string;
  contentItems?: ContentItem[];
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  order_index: number;
  estimated_duration: number;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  creator_name: string;
  estimated_duration: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  learning_objectives: string[];
  modules?: Module[];
}

interface CourseEditorProps {
  courseId: string;
  userToken: string;
}

export default function CourseEditor({ courseId, userToken }: CourseEditorProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<{ [moduleId: string]: boolean }>({});

  useEffect(() => {
    loadCourseStructure();
  }, [courseId]);

  const loadCourseStructure = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/cms/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data);
      
      // Auto-expand first module and lesson for better UX
      if (data.modules && data.modules.length > 0) {
        const firstModuleId = data.modules[0].id;
        setExpandedModules(new Set([firstModuleId]));
        
        if (data.modules[0].lessons && data.modules[0].lessons.length > 0) {
          setExpandedLessons(new Set([data.modules[0].lessons[0].id]));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLessonExpanded = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const handleAddModule = async (moduleData: Partial<Module>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/cms/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          title: moduleData.title,
          description: moduleData.description,
          learningObjectives: moduleData.learning_objectives,
          estimatedDuration: moduleData.estimated_duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create module');
      }

      await loadCourseStructure();
      setShowAddModule(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create module');
    }
  };

  const handleAddLesson = async (moduleId: string, lessonData: Partial<Lesson>) => {
    try {
      const response = await fetch(`http://localhost:3001/api/cms/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          title: lessonData.title,
          description: lessonData.description,
          learningObjectives: lessonData.learning_objectives,
          estimatedDuration: lessonData.estimated_duration,
          lessonType: lessonData.lesson_type || 'content',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create lesson');
      }

      await loadCourseStructure();
      setShowAddLesson({ ...showAddLesson, [moduleId]: false });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create lesson');
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <h3 className="text-lg font-medium">Error loading course</h3>
          <p className="mt-2">{error || 'Course not found'}</p>
          <button 
            onClick={loadCourseStructure}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
            
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full ${
                course.status === 'published' ? 'bg-green-100 text-green-800' : 
                course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(course.estimated_duration)}
              </span>
              <span className={`capitalize ${
                course.difficulty_level === 'beginner' ? 'text-green-600' :
                course.difficulty_level === 'intermediate' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {course.difficulty_level}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => window.open(`/courses/${courseId}`, '_blank')}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>

        {course.learning_objectives.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Learning Objectives
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {course.learning_objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Course Structure */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Structure</h2>
          <button
            onClick={() => setShowAddModule(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <ModuleItem
                key={module.id}
                module={module}
                isExpanded={expandedModules.has(module.id)}
                expandedLessons={expandedLessons}
                onToggleExpanded={() => toggleModuleExpanded(module.id)}
                onToggleLessonExpanded={toggleLessonExpanded}
                onAddLesson={handleAddLesson}
                showAddLesson={showAddLesson[module.id] || false}
                setShowAddLesson={(show) => setShowAddLesson({ ...showAddLesson, [module.id]: show })}
                userToken={userToken}
                onReload={loadCourseStructure}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No modules yet. Add your first module to get started.</p>
            </div>
          )}
        </div>

        {/* Add Module Form */}
        {showAddModule && (
          <AddModuleForm
            onSubmit={handleAddModule}
            onCancel={() => setShowAddModule(false)}
          />
        )}
      </div>
    </div>
  );
}

// Module Item Component
interface ModuleItemProps {
  module: Module;
  isExpanded: boolean;
  expandedLessons: Set<string>;
  onToggleExpanded: () => void;
  onToggleLessonExpanded: (lessonId: string) => void;
  onAddLesson: (moduleId: string, lessonData: Partial<Lesson>) => Promise<void>;
  showAddLesson: boolean;
  setShowAddLesson: (show: boolean) => void;
  userToken: string;
  onReload: () => void;
}

function ModuleItem({ 
  module, 
  isExpanded, 
  expandedLessons,
  onToggleExpanded, 
  onToggleLessonExpanded,
  onAddLesson,
  showAddLesson,
  setShowAddLesson,
  userToken,
  onReload
}: ModuleItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          <button className="p-1">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <BookOpen className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <span className="text-sm text-gray-500">
            {module.lessons?.length || 0} lessons
          </span>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(module.estimated_duration)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddLesson(true);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Lesson
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Module Learning Objectives */}
          {module.learning_objectives && module.learning_objectives.length > 0 && (
            <div className="mb-4 pl-8">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Module Objectives:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {module.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lessons */}
          <div className="space-y-2 pl-8">
            {module.lessons && module.lessons.length > 0 ? (
              module.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedLessons.has(lesson.id)}
                  onToggleExpanded={() => onToggleLessonExpanded(lesson.id)}
                  userToken={userToken}
                  onReload={onReload}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No lessons yet</p>
            )}
          </div>

          {/* Add Lesson Form */}
          {showAddLesson && (
            <div className="mt-4 pl-8">
              <AddLessonForm
                moduleId={module.id}
                onSubmit={(lessonData) => onAddLesson(module.id, lessonData)}
                onCancel={() => setShowAddLesson(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  function formatDuration(minutes: number) {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

// Lesson Item Component
interface LessonItemProps {
  lesson: Lesson;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  userToken: string;
  onReload: () => void;
}

function LessonItem({ lesson, isExpanded, onToggleExpanded, userToken, onReload }: LessonItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div 
        className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          <button className="p-1">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <FileText className="h-4 w-4 text-gray-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">{lesson.title}</h4>
            {lesson.description && (
              <p className="text-xs text-gray-600 mt-1">{lesson.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500" onClick={(e) => e.stopPropagation()}>
          <span>{lesson.contentItems?.length || 0} items</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(lesson.estimated_duration)}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          {/* Lesson Learning Objectives */}
          {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Lesson Objectives:</h5>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                {lesson.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Items */}
          {lesson.contentItems && lesson.contentItems.length > 0 ? (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Content:</h5>
              {lesson.contentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600 pl-4">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-gray-400">({item.content_type})</span>
                  {item.is_required && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Required</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No content items yet</p>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/cms/lessons/${lesson.id}/content`;
            }}
            className="mt-3 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Manage Content
          </button>
        </div>
      )}
    </div>
  );

  function formatDuration(minutes: number) {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

// Add Module Form Component
interface AddModuleFormProps {
  onSubmit: (moduleData: Partial<Module>) => void;
  onCancel: () => void;
}

function AddModuleForm({ onSubmit, onCancel }: AddModuleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    learning_objectives: [''],
    estimated_duration: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
      estimated_duration: formData.estimated_duration,
    } as Partial<Module>);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      learning_objectives: [...formData.learning_objectives, '']
    });
  };

  const removeObjective = (index: number) => {
    if (formData.learning_objectives.length > 1) {
      const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
      setFormData({ ...formData, learning_objectives: newObjectives });
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Module</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter module title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Brief description of the module"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Objectives
          </label>
          {formData.learning_objectives.map((objective, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`Objective ${index + 1}`}
              />
              {formData.learning_objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addObjective}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            + Add another objective
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Module
          </button>
        </div>
      </form>
    </div>
  );
}

// Add Lesson Form Component
interface AddLessonFormProps {
  moduleId: string;
  onSubmit: (lessonData: Partial<Lesson>) => void;
  onCancel: () => void;
}

function AddLessonForm({ moduleId, onSubmit, onCancel }: AddLessonFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    learning_objectives: [''],
    estimated_duration: 0,
    lesson_type: 'content',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
      estimated_duration: formData.estimated_duration,
      lesson_type: formData.lesson_type,
    } as Partial<Lesson>);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      learning_objectives: [...formData.learning_objectives, '']
    });
  };

  const removeObjective = (index: number) => {
    if (formData.learning_objectives.length > 1) {
      const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
      setFormData({ ...formData, learning_objectives: newObjectives });
    }
  };

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="text-md font-medium text-gray-900 mb-3">Add New Lesson</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lesson Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="Enter lesson title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            placeholder="Brief description of the lesson"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={formData.estimated_duration}
              onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Type
            </label>
            <select
              value={formData.lesson_type}
              onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            >
              <option value="content">Content</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="discussion">Discussion</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Objectives
          </label>
          {formData.learning_objectives.map((objective, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                placeholder={`Objective ${index + 1}`}
              />
              {formData.learning_objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addObjective}
            className="text-green-600 hover:text-green-700 text-sm"
          >
            + Add another objective
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Add Lesson
          </button>
        </div>
      </form>
    </div>
  );
}
