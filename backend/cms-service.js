// Content Management Service
// File: backend/cms-service.js

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class ContentManagementService {
  constructor(db) {
    this.db = db;
    this.uploadsDir = path.join(__dirname, 'uploads');
    this.ensureUploadsDirectory();
  }

  async ensureUploadsDirectory() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'videos'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'pdfs'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'images'), { recursive: true });
    }
  }

  // ===== COURSE MANAGEMENT =====

  async createCourse(creatorId, courseData) {
    const courseId = uuidv4();
    const course = {
      id: courseId,
      title: courseData.title,
      description: courseData.description || '',
      learning_objectives: JSON.stringify(courseData.learningObjectives || []),
      estimated_duration: courseData.estimatedDuration || 0,
      difficulty_level: courseData.difficultyLevel || 'beginner',
      created_by: creatorId,
      status: 'draft'
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO courses (id, title, description, learning_objectives, estimated_duration, difficulty_level, created_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [course.id, course.title, course.description, course.learning_objectives, 
         course.estimated_duration, course.difficulty_level, course.created_by, course.status],
        function(err) {
          if (err) reject(err);
          else resolve(course);
        }
      );
    });
  }

  async getCourses(creatorId = null, status = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT c.*, u.name as creator_name,
                          COALESCE(COUNT(m.id), 0) as moduleCount
                   FROM courses c 
                   JOIN users u ON c.created_by = u.id
                   LEFT JOIN course_modules m ON c.id = m.course_id`;
      let params = [];

      const conditions = [];
      if (creatorId) {
        conditions.push('c.created_by = ?');
        params.push(creatorId);
      }
      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY c.id ORDER BY c.updated_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const courses = rows.map(row => ({
            ...row,
            learning_objectives: JSON.parse(row.learning_objectives || '[]'),
            moduleCount: row.moduleCount || 0
          }));
          resolve(courses);
        }
      });
    });
  }

  async getCourse(courseId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT c.*, u.name as creator_name,
                COALESCE(COUNT(m.id), 0) as moduleCount
         FROM courses c 
         JOIN users u ON c.created_by = u.id 
         LEFT JOIN course_modules m ON c.id = m.course_id
         WHERE c.id = ?
         GROUP BY c.id`,
        [courseId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            resolve({
              ...row,
              learning_objectives: JSON.parse(row.learning_objectives || '[]'),
              moduleCount: row.moduleCount || 0
            });
          }
        }
      );
    });
  }

  async updateCourse(courseId, updates) {
    const allowedFields = ['title', 'description', 'learning_objectives', 'estimated_duration', 'difficulty_level', 'status'];
    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(key === 'learning_objectives' ? JSON.stringify(updates[key]) : updates[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(courseId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // ===== MODULE MANAGEMENT =====

  async createModule(courseId, moduleData) {
    const moduleId = uuidv4();
    
    // Get next order index
    const maxOrder = await this.getMaxOrder('course_modules', 'course_id', courseId);
    
    const module = {
      id: moduleId,
      course_id: courseId,
      title: moduleData.title,
      description: moduleData.description || '',
      learning_objectives: JSON.stringify(moduleData.learningObjectives || []),
      order_index: maxOrder + 1,
      estimated_duration: moduleData.estimatedDuration || 0
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO course_modules (id, course_id, title, description, learning_objectives, order_index, estimated_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [module.id, module.course_id, module.title, module.description, 
         module.learning_objectives, module.order_index, module.estimated_duration],
        function(err) {
          if (err) reject(err);
          else resolve(module);
        }
      );
    });
  }

  async getModules(courseId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC',
        [courseId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const modules = rows.map(row => ({
              ...row,
              learning_objectives: JSON.parse(row.learning_objectives || '[]')
            }));
            resolve(modules);
          }
        }
      );
    });
  }

  // ===== LESSON MANAGEMENT =====

  async createLesson(moduleId, lessonData) {
    const lessonId = uuidv4();
    
    // Get next order index
    const maxOrder = await this.getMaxOrder('course_lessons', 'module_id', moduleId);
    
    const lesson = {
      id: lessonId,
      module_id: moduleId,
      title: lessonData.title,
      description: lessonData.description || '',
      learning_objectives: JSON.stringify(lessonData.learningObjectives || []),
      order_index: maxOrder + 1,
      estimated_duration: lessonData.estimatedDuration || 0,
      lesson_type: lessonData.lessonType || 'content'
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO course_lessons (id, module_id, title, description, learning_objectives, order_index, estimated_duration, lesson_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lesson.id, lesson.module_id, lesson.title, lesson.description, 
         lesson.learning_objectives, lesson.order_index, lesson.estimated_duration, lesson.lesson_type],
        function(err) {
          if (err) reject(err);
          else resolve(lesson);
        }
      );
    });
  }

  async getLessons(moduleId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM course_lessons WHERE module_id = ? ORDER BY order_index ASC',
        [moduleId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const lessons = rows.map(row => ({
              ...row,
              learning_objectives: JSON.parse(row.learning_objectives || '[]')
            }));
            resolve(lessons);
          }
        }
      );
    });
  }

  // ===== CONTENT MANAGEMENT =====

  async addContentItem(lessonId, contentData, filePath = null) {
    const contentId = uuidv4();
    
    // Get next order index
    const maxOrder = await this.getMaxOrder('content_items', 'lesson_id', lessonId);
    
    // Convert absolute file path to relative path for serving
    let relativeFilePath = null;
    if (filePath) {
      // Extract relative path from uploads directory
      // filePath is like: /full/path/to/backend/uploads/pdfs/filename.pdf
      // We want: pdfs/filename.pdf
      const uploadsIndex = filePath.indexOf('uploads/');
      if (uploadsIndex !== -1) {
        relativeFilePath = filePath.substring(uploadsIndex + 8); // Skip 'uploads/'
      } else {
        // Fallback: use just the filename
        relativeFilePath = path.basename(filePath);
      }
    }
    
    const content = {
      id: contentId,
      lesson_id: lessonId,
      title: contentData.title,
      description: contentData.description || '',
      content_type: contentData.contentType,
      file_path: relativeFilePath, // Store relative path like 'pdfs/filename.pdf'
      file_name: contentData.fileName || null,
      file_size: contentData.fileSize || null,
      duration: contentData.duration || null,
      metadata: JSON.stringify(contentData.metadata || {}),
      order_index: maxOrder + 1,
      is_required: contentData.isRequired !== false
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO content_items (id, lesson_id, title, description, content_type, file_path, file_name, file_size, duration, metadata, order_index, is_required)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [content.id, content.lesson_id, content.title, content.description, content.content_type,
         content.file_path, content.file_name, content.file_size, content.duration, 
         content.metadata, content.order_index, content.is_required],
        function(err) {
          if (err) reject(err);
          else resolve(content);
        }
      );
    });
  }

  async getContentItems(lessonId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM content_items WHERE lesson_id = ? ORDER BY order_index ASC',
        [lessonId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const content = rows.map(row => {
              const item = {
                ...row,
                metadata: JSON.parse(row.metadata || '{}')
              };
              
              // Add proper contentUrl for different content types
              if (row.content_type === 'pdf' && row.file_path) {
                item.contentUrl = `http://localhost:3001/api/cms/files/${row.file_path}`;
                item.metadata.filePath = `http://localhost:3001/api/cms/files/${row.file_path}`;
              } else if (row.content_type === 'video') {
                if (item.metadata.videoId) {
                  item.videoId = item.metadata.videoId;  // Store at top level for compatibility
                  item.contentUrl = `https://www.youtube.com/watch?v=${item.metadata.videoId}`;
                } else if (item.metadata.contentUrl) {
                  item.contentUrl = item.metadata.contentUrl;
                  // Extract videoId from contentUrl if available
                  const match = item.metadata.contentUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                  if (match) {
                    item.videoId = match[1];
                    item.metadata.videoId = match[1];  // Store in metadata too
                  }
                }
              } else if (row.content_type === 'form') {
                if (item.metadata.formUrl) {
                  item.contentUrl = item.metadata.formUrl;
                }
              }
              
              return item;
            });
            resolve(content);
          }
        }
      );
    });
  }

  // ===== COURSE STRUCTURE =====

  async getFullCourseStructure(courseId) {
    try {
      const course = await this.getCourse(courseId);
      if (!course) return null;

      const modules = await this.getModules(courseId);
      
      // Get lessons and content for each module
      for (const module of modules) {
        module.lessons = await this.getLessons(module.id);
        
        // Get content items for each lesson
        for (const lesson of module.lessons) {
          lesson.contentItems = await this.getContentItems(lesson.id);
        }
      }

      course.modules = modules;
      return course;
    } catch (error) {
      throw new Error(`Failed to get course structure: ${error.message}`);
    }
  }

  async updateContentItem(contentId, contentData, filePath = null) {
    const allowedFields = ['title', 'description', 'content_type', 'duration', 'metadata', 'is_required'];
    const updateFields = [];
    const values = [];

    Object.keys(contentData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        if (key === 'metadata') {
          values.push(JSON.stringify(contentData[key] || {}));
        } else if (key === 'is_required') {
          values.push(contentData[key] !== false);
        } else {
          values.push(contentData[key]);
        }
      }
    });

    // Add file path if provided (for file uploads)
    if (filePath) {
      // Convert absolute file path to relative path for serving
      let relativeFilePath = null;
      const uploadsIndex = filePath.indexOf('uploads/');
      if (uploadsIndex !== -1) {
        relativeFilePath = filePath.substring(uploadsIndex + 8); // Skip 'uploads/'
      } else {
        // Fallback: use just the filename
        relativeFilePath = path.basename(filePath);
      }
      
      updateFields.push('file_path = ?');
      values.push(relativeFilePath);
      
      if (contentData.fileName) {
        updateFields.push('file_name = ?');
        values.push(contentData.fileName);
      }
      
      if (contentData.fileSize) {
        updateFields.push('file_size = ?');
        values.push(contentData.fileSize);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(contentId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE content_items SET ${updateFields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  async deleteContentItem(contentId) {
    return new Promise((resolve, reject) => {
      // First get the content item to delete any associated file
      this.db.get(
        'SELECT file_path FROM content_items WHERE id = ?',
        [contentId],
        async (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Delete the file if it exists
          if (row && row.file_path) {
            try {
              await fs.unlink(row.file_path);
            } catch (fileErr) {
              console.warn('Failed to delete file:', fileErr.message);
            }
          }
          
          // Delete the database record
          this.db.run(
            'DELETE FROM content_items WHERE id = ?',
            [contentId],
            function(deleteErr) {
              if (deleteErr) reject(deleteErr);
              else resolve({ changes: this.changes });
            }
          );
        }
      );
    });
  }

  // ===== ORDERING HELPERS =====

  async getMaxOrder(table, parentColumn, parentId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COALESCE(MAX(order_index), 0) as max_order FROM ${table} WHERE ${parentColumn} = ?`,
        [parentId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.max_order || 0);
        }
      );
    });
  }

  async reorderItems(table, parentColumn, parentId, itemIds) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        let completed = 0;
        let hasError = false;

        itemIds.forEach((itemId, index) => {
          this.db.run(
            `UPDATE ${table} SET order_index = ? WHERE id = ? AND ${parentColumn} = ?`,
            [index + 1, itemId, parentId],
            (err) => {
              if (err && !hasError) {
                hasError = true;
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              completed++;
              if (completed === itemIds.length && !hasError) {
                this.db.run('COMMIT', (commitErr) => {
                  if (commitErr) reject(commitErr);
                  else resolve({ reordered: itemIds.length });
                });
              }
            }
          );
        });
      });
    });
  }

  // ===== PERMISSIONS =====

  async canUserEditCourse(userId, courseId) {
    return new Promise((resolve, reject) => {
      // Check if user is course creator or has admin permissions
      this.db.get(
        `SELECT c.created_by, cr.role FROM courses c
         LEFT JOIN course_creators cr ON cr.user_id = ?
         WHERE c.id = ?`,
        [userId, courseId],
        (err, row) => {
          if (err) reject(err);
          else {
            const canEdit = row && (
              row.created_by === userId || 
              row.role === 'admin' || 
              row.role === 'collaborator'
            );
            resolve(canEdit);
          }
        }
      );
    });
  }

  async getUserCreatorPermissions(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM course_creators WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else {
            resolve(row ? {
              ...row,
              permissions: JSON.parse(row.permissions || '[]')
            } : null);
          }
        }
      );
    });
  }
}

module.exports = ContentManagementService;