# Course Management System - Module & Lesson Editor

## Overview
The CMS now supports a complete hierarchical course structure:
- **Courses** → Top-level containers
- **Modules** → Major sections within a course
- **Lessons** → Individual learning units within modules
- **Content Items** → Specific content pieces within lessons (videos, text, PDFs, etc.)

## New Features

### 1. Course Editor
Access the course editor by clicking the **Edit** button on any course in the CMS dashboard.

**URL**: `/cms/courses/[courseId]/edit`

**Features**:
- View complete course structure at a glance
- Add modules to organize your course content
- Add lessons within each module
- Expandable/collapsible interface for easy navigation
- View learning objectives at each level
- See duration estimates for modules and lessons

### 2. Module Management

**Creating a Module**:
1. Navigate to the Course Editor
2. Click "Add Module" button
3. Fill in:
   - Module title (required)
   - Description
   - Learning objectives
   - Estimated duration

**Module Features**:
- Automatic ordering (new modules added to the end)
- Display lesson count
- Expandable to show lessons and objectives
- Duration tracking

### 3. Lesson Management

**Creating a Lesson**:
1. In the Course Editor, expand a module
2. Click "Add Lesson" button for that module
3. Fill in:
   - Lesson title (required)
   - Description
   - Learning objectives
   - Estimated duration
   - Lesson type (content, quiz, assignment, discussion)

**Lesson Features**:
- Automatic ordering within modules
- Content item count display
- Expandable to show objectives and content
- "Manage Content" button to add content items

### 4. Content Management

**Adding Content to Lessons**:
1. Click "Manage Content" on any lesson
2. Click "Add Content" button
3. For text content, fill in:
   - Title (required)
   - Description
   - Content (supports markdown)
   - Required/optional flag

**URL**: `/cms/lessons/[lessonId]/content`

**Supported Content Types**:
- Text (markdown supported)
- Video (coming soon - file upload)
- PDF (coming soon - file upload)  
- Images (coming soon - file upload)

## Navigation Flow

1. **CMS Dashboard** (`/cms`)
   - View all courses
   - Create new courses
   - Access course editor

2. **Course Editor** (`/cms/courses/[courseId]/edit`)
   - Manage course structure
   - Add/edit modules
   - Add/edit lessons

3. **Lesson Content Manager** (`/cms/lessons/[lessonId]/content`)
   - Add content items
   - Manage lesson materials
   - Order content

## Database Structure

The system uses SQLite with the following hierarchy:
```
courses
  └── course_modules
        └── course_lessons
              └── content_items
```

Each level supports:
- Learning objectives
- Duration estimates
- Ordering
- Descriptions
- Status tracking

## API Endpoints

### Modules
- `GET /api/cms/courses/:courseId/modules` - Get all modules for a course
- `POST /api/cms/courses/:courseId/modules` - Create a new module

### Lessons
- `GET /api/cms/modules/:moduleId/lessons` - Get all lessons for a module
- `POST /api/cms/modules/:moduleId/lessons` - Create a new lesson

### Content
- `GET /api/cms/lessons/:lessonId/content` - Get all content for a lesson
- `POST /api/cms/lessons/:lessonId/content/text` - Add text content
- `POST /api/cms/lessons/:lessonId/content` - Add file-based content (with upload)

## Next Steps

To use the new features:

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   cd frontend-next
   npm run dev
   ```

3. **Navigate to CMS**:
   - Go to http://localhost:3000/cms
   - Log in with your credentials
   - Select a course and click Edit

4. **Build your course structure**:
   - Add modules to organize major topics
   - Add lessons within each module
   - Add content items to each lesson

## Future Enhancements

Planned features:
- Drag-and-drop reordering for modules/lessons
- File upload for videos, PDFs, and images
- Bulk import/export of course structures
- Preview mode for content
- Student progress tracking
- Quiz and assignment builders
- Discussion forum integration
