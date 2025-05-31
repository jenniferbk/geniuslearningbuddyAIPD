// Course Creator Interface
// File: frontend/src/components/CourseCreator.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CourseCreator.css';

const CourseCreator = () => {
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    learningObjectives: [''],
    estimatedDuration: 0,
    difficultyLevel: 'beginner'
  });

  // Module form state
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    learningObjectives: [''],
    estimatedDuration: 0
  });

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    lessonType: 'content',
    estimatedDuration: 0
  });

  // Content upload state
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    contentType: 'video',
    isRequired: true
  });

  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cms/courses?my_courses=true');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/cms/courses', {
        ...courseForm,
        learningObjectives: courseForm.learningObjectives.filter(obj => obj.trim())
      });
      
      setCourses([...courses, response.data]);
      setCourseForm({
        title: '',
        description: '',
        learningObjectives: [''],
        estimatedDuration: 0,
        difficultyLevel: 'beginner'
      });
      setView('list');
    } catch (err) {
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const addModule = async (courseId) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/cms/courses/${courseId}/modules`, {
        ...moduleForm,
        learningObjectives: moduleForm.learningObjectives.filter(obj => obj.trim())
      });
      
      // Refresh course structure
      const courseResponse = await axios.get(`/api/cms/courses/${courseId}`);
      setCurrentCourse(courseResponse.data);
      
      setModuleForm({
        title: '',
        description: '',
        learningObjectives: [''],
        estimatedDuration: 0
      });
    } catch (err) {
      setError('Failed to add module');
    } finally {
      setLoading(false);
    }
  };

  const addLesson = async (moduleId) => {
    try {
      setLoading(true);
      await axios.post(`/api/cms/modules/${moduleId}/lessons`, lessonForm);
      
      // Refresh course structure
      const courseResponse = await axios.get(`/api/cms/courses/${currentCourse.id}`);
      setCurrentCourse(courseResponse.data);
      
      setLessonForm({
        title: '',
        description: '',
        lessonType: 'content',
        estimatedDuration: 0
      });
    } catch (err) {
      setError('Failed to add lesson');
    } finally {
      setLoading(false);
    }
  };

  const uploadContent = async (lessonId) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      if (uploadFile) {
        formData.append('file', uploadFile);
      }
      
      formData.append('contentData', JSON.stringify(contentForm));
      
      const endpoint = uploadFile 
        ? `/api/cms/lessons/${lessonId}/content`
        : `/api/cms/lessons/${lessonId}/content/text`;
      
      await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh course structure
      const courseResponse = await axios.get(`/api/cms/courses/${currentCourse.id}`);
      setCurrentCourse(courseResponse.data);
      
      setContentForm({
        title: '',
        description: '',
        contentType: 'video',
        isRequired: true
      });
      setUploadFile(null);
    } catch (err) {
      setError('Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const updateLearningObjectives = (objectives, setter) => {
    setter(prev => ({
      ...prev,
      learningObjectives: objectives
    }));
  };

  const addObjective = (objectives, setter) => {
    updateLearningObjectives([...objectives, ''], setter);
  };

  const removeObjective = (index, objectives, setter) => {
    updateLearningObjectives(objectives.filter((_, i) => i !== index), setter);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="course-creator">
      <header className="creator-header">
        <h1>Course Creator</h1>
        <nav className="creator-nav">
          <button 
            className={view === 'list' ? 'active' : ''} 
            onClick={() => setView('list')}
          >
            My Courses
          </button>
          <button 
            className={view === 'create' ? 'active' : ''} 
            onClick={() => setView('create')}
          >
            Create Course
          </button>
        </nav>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {view === 'list' && (
        <div className="courses-list">
          <h2>Your Courses</h2>
          {courses.length === 0 ? (
            <p>No courses yet. <button onClick={() => setView('create')}>Create your first course</button></p>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span className={`status ${course.status}`}>{course.status}</span>
                    <span className="duration">{Math.round(course.estimated_duration / 60)}h</span>
                    <span className="difficulty">{course.difficulty_level}</span>
                  </div>
                  <div className="course-actions">
                    <button onClick={async () => {
                      const response = await axios.get(`/api/cms/courses/${course.id}`);
                      setCurrentCourse(response.data);
                      setView('edit');
                    }}>
                      Edit Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="course-form">
          <h2>Create New Course</h2>
          <form onSubmit={createCourse}>
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Learning Objectives</label>
              {courseForm.learningObjectives.map((objective, index) => (
                <div key={index} className="objective-input">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => {
                      const newObjectives = [...courseForm.learningObjectives];
                      newObjectives[index] = e.target.value;
                      updateLearningObjectives(newObjectives, setCourseForm);
                    }}
                    placeholder="Learning objective..."
                  />
                  {courseForm.learningObjectives.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeObjective(index, courseForm.learningObjectives, setCourseForm)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => addObjective(courseForm.learningObjectives, setCourseForm)}
              >
                Add Objective
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Duration (minutes)</label>
                <input
                  type="number"
                  value={courseForm.estimatedDuration}
                  onChange={(e) => setCourseForm({...courseForm, estimatedDuration: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-group">
                <label>Difficulty Level</label>
                <select
                  value={courseForm.difficultyLevel}
                  onChange={(e) => setCourseForm({...courseForm, difficultyLevel: e.target.value})}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setView('list')}>Cancel</button>
              <button type="submit" disabled={loading}>Create Course</button>
            </div>
          </form>
        </div>
      )}

      {view === 'edit' && currentCourse && (
        <div className="course-editor">
          <div className="course-header">
            <h2>{currentCourse.title}</h2>
            <button onClick={() => setView('list')}>← Back to Courses</button>
          </div>

          <div className="course-structure">
            {currentCourse.modules?.map(module => (
              <div key={module.id} className="module">
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                
                <div className="lessons">
                  {module.lessons?.map(lesson => (
                    <div key={lesson.id} className="lesson">
                      <h4>{lesson.title}</h4>
                      <p>{lesson.description}</p>
                      
                      <div className="content-items">
                        {lesson.contentItems?.map(content => (
                          <div key={content.id} className="content-item">
                            <span className="content-type">{content.content_type}</span>
                            <span className="content-title">{content.title}</span>
                            {content.file_name && (
                              <span className="file-name">{content.file_name}</span>
                            )}
                          </div>
                        ))}
                        
                        {/* Add content form */}
                        <div className="add-content">
                          <h5>Add Content</h5>
                          <input
                            type="text"
                            placeholder="Content title"
                            value={contentForm.title}
                            onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                          />
                          <input
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            accept="video/*,application/pdf,image/*"
                          />
                          <button onClick={() => uploadContent(lesson.id)}>
                            Add Content
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add lesson form */}
                  <div className="add-lesson">
                    <h4>Add Lesson</h4>
                    <input
                      type="text"
                      placeholder="Lesson title"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                    />
                    <button onClick={() => addLesson(module.id)}>
                      Add Lesson
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add module form */}
            <div className="add-module">
              <h3>Add Module</h3>
              <input
                type="text"
                placeholder="Module title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
              />
              <textarea
                placeholder="Module description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
              />
              <button onClick={() => addModule(currentCourse.id)}>
                Add Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreator;