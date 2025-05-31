// CMS API Routes
// File: backend/cms-routes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ContentManagementService = require('./cms-service');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, 'uploads');
    
    if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(uploadPath, 'videos');
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(uploadPath, 'pdfs');
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadPath, 'images');
    } else {
      uploadPath = path.join(uploadPath, 'documents');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename while preserving extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept videos, PDFs, images, and documents
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/mov', 'video/avi',
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/markdown',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Initialize CMS service (passed from main server)
let cmsService;

const initializeCMS = (db) => {
  cmsService = new ContentManagementService(db);
};

// Middleware to check creator permissions
const checkCreatorPermissions = async (req, res, next) => {
  try {
    const permissions = await cmsService.getUserCreatorPermissions(req.user.userId);
    
    if (!permissions) {
      return res.status(403).json({ error: 'Not authorized to create content' });
    }
    
    req.creatorPermissions = permissions;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to check permissions' });
  }
};

// ===== COURSE ROUTES =====

// Get all courses (for content creators)
router.get('/courses', async (req, res) => {
  try {
    const { status, my_courses } = req.query;
    const creatorId = my_courses === 'true' ? req.user.userId : null;
    
    const courses = await cmsService.getCourses(creatorId, status);
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course with full structure
router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await cmsService.getFullCourseStructure(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create new course
router.post('/courses', checkCreatorPermissions, async (req, res) => {
  try {
    const courseData = req.body;
    const course = await cmsService.createCourse(req.user.userId, courseData);
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/courses/:courseId', checkCreatorPermissions, async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;
    
    // Check if user can edit this course
    const canEdit = await cmsService.canUserEditCourse(req.user.userId, courseId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this course' });
    }
    
    const result = await cmsService.updateCourse(courseId, updates);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// ===== MODULE ROUTES =====

// Get modules for a course
router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const modules = await cmsService.getModules(courseId);
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Create new module
router.post('/courses/:courseId/modules', checkCreatorPermissions, async (req, res) => {
  try {
    const { courseId } = req.params;
    const moduleData = req.body;
    
    // Check if user can edit this course
    const canEdit = await cmsService.canUserEditCourse(req.user.userId, courseId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this course' });
    }
    
    const module = await cmsService.createModule(courseId, moduleData);
    res.status(201).json(module);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// ===== LESSON ROUTES =====

// Get lessons for a module
router.get('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const lessons = await cmsService.getLessons(moduleId);
    res.json(lessons);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Create new lesson
router.post('/modules/:moduleId/lessons', checkCreatorPermissions, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const lessonData = req.body;
    
    const lesson = await cmsService.createLesson(moduleId, lessonData);
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// ===== CONTENT ROUTES =====

// Get content items for a lesson
router.get('/lessons/:lessonId/content', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const content = await cmsService.getContentItems(lessonId);
    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Upload content file
router.post('/lessons/:lessonId/content', checkCreatorPermissions, upload.single('file'), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const file = req.file;
    const contentData = JSON.parse(req.body.contentData || '{}');
    
    if (!file && contentData.contentType !== 'text') {
      return res.status(400).json({ error: 'File required for this content type' });
    }
    
    // Determine content type from file
    let contentType = contentData.contentType;
    if (file) {
      if (file.mimetype.startsWith('video/')) contentType = 'video';
      else if (file.mimetype === 'application/pdf') contentType = 'pdf';
      else if (file.mimetype.startsWith('image/')) contentType = 'image';
      else contentType = 'document';
    }
    
    const contentItem = await cmsService.addContentItem(lessonId, {
      title: contentData.title || file?.originalname || 'Untitled',
      description: contentData.description || '',
      contentType: contentType,
      fileName: file?.originalname,
      fileSize: file?.size,
      duration: contentData.duration,
      metadata: contentData.metadata || {},
      isRequired: contentData.isRequired !== false
    }, file?.path);
    
    res.status(201).json(contentItem);
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({ error: 'Failed to upload content' });
  }
});

// Add text content (no file upload)
router.post('/lessons/:lessonId/content/text', checkCreatorPermissions, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const contentData = req.body;
    
    const contentItem = await cmsService.addContentItem(lessonId, {
      ...contentData,
      contentType: 'text'
    });
    
    res.status(201).json(contentItem);
  } catch (error) {
    console.error('Add text content error:', error);
    res.status(500).json({ error: 'Failed to add text content' });
  }
});

// Serve uploaded files
router.get('/uploads/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', type, filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// ===== ORDERING ROUTES =====

// Reorder modules within a course
router.put('/courses/:courseId/modules/reorder', checkCreatorPermissions, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleIds } = req.body;
    
    const canEdit = await cmsService.canUserEditCourse(req.user.userId, courseId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this course' });
    }
    
    const result = await cmsService.reorderItems('course_modules', 'course_id', courseId, moduleIds);
    res.json(result);
  } catch (error) {
    console.error('Reorder modules error:', error);
    res.status(500).json({ error: 'Failed to reorder modules' });
  }
});

// Reorder lessons within a module
router.put('/modules/:moduleId/lessons/reorder', checkCreatorPermissions, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { lessonIds } = req.body;
    
    const result = await cmsService.reorderItems('course_lessons', 'module_id', moduleId, lessonIds);
    res.json(result);
  } catch (error) {
    console.error('Reorder lessons error:', error);
    res.status(500).json({ error: 'Failed to reorder lessons' });
  }
});

// Reorder content within a lesson
router.put('/lessons/:lessonId/content/reorder', checkCreatorPermissions, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { contentIds } = req.body;
    
    const result = await cmsService.reorderItems('content_items', 'lesson_id', lessonId, contentIds);
    res.json(result);
  } catch (error) {
    console.error('Reorder content error:', error);
    res.status(500).json({ error: 'Failed to reorder content' });
  }
});

// ===== PERMISSIONS ROUTES =====

// Grant creator permissions to a user
router.post('/creators', checkCreatorPermissions, async (req, res) => {
  try {
    const { email, role, permissions } = req.body;
    
    // Only admins can grant permissions
    if (req.creatorPermissions.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can grant creator permissions' });
    }
    
    // Find user by email
    const db = cmsService.db;
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Grant permissions
      const creatorId = uuidv4();
      db.run(
        'INSERT OR REPLACE INTO course_creators (id, user_id, role, permissions) VALUES (?, ?, ?, ?)',
        [creatorId, user.id, role || 'creator', JSON.stringify(permissions || ['create_course', 'edit_own', 'upload_content'])],
        function(insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: 'Failed to grant permissions' });
          }
          
          res.json({ success: true, message: `Permissions granted to ${email}` });
        }
      );
    });
  } catch (error) {
    console.error('Grant permissions error:', error);
    res.status(500).json({ error: 'Failed to grant permissions' });
  }
});

// Export router and initialization function
module.exports = { router, initializeCMS };