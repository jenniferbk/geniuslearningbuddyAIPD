# Course Management Dashboard

A comprehensive content management system for creating and managing educational courses with AI learning buddy integration.

## Features

### ✅ Course Management Dashboard (Completed)
- **Course Overview**: Grid and list views with statistics
- **Search & Filter**: Real-time search by title, description, creator
- **Status Management**: Draft, Published, Archived courses  
- **Creator Permissions**: Role-based access control
- **Course Creation**: Modal form with learning objectives
- **Course Actions**: Edit, Delete, Preview functionality

### Backend API (Already Complete)
- Full CRUD operations for courses, modules, lessons, content
- File upload with 500MB limit support
- Multi-format content types (video, PDF, images, documents, text, markdown)
- Drag-drop reordering capabilities
- Permission system with creator roles

## Getting Started

### 1. Install Dependencies
```bash
cd frontend-next
npm install
```

### 2. Backend Setup
Ensure the backend server is running on port 3001:
```bash
cd backend
npm start
```

### 3. User Permissions
**✅ Automatic:** All users now automatically receive creator permissions upon registration!

For existing users (who registered before this update), run:
```bash
cd backend
node grant-creator-permissions-to-all.js
```

### 4. Access the Dashboard
Navigate to `/cms` after logging in with a user who has creator permissions.

## Usage

### Creating a Course
1. Click "Create Course" button
2. Fill in course details:
   - Title (required)
   - Description
   - Estimated duration in minutes  
   - Difficulty level (beginner/intermediate/advanced)
   - Learning objectives (add multiple)
3. Click "Create Course" to save as draft

### Managing Courses
- **Grid/List View**: Toggle between visual layouts
- **Search**: Real-time search across title, description, creator
- **Filter**: By status (all, draft, published, archived)
- **My Courses**: Show only courses you created
- **Actions**: Preview (👁️), Edit (✏️), Delete (🗑️)

### Course Statistics
The dashboard shows:
- Total courses count
- Published courses count  
- Draft courses count
- Your courses count

## Next Steps

### Phase 2: Course Structure Editor (Upcoming)
- Module management (add/edit/delete/reorder)
- Lesson management within modules
- Content item management within lessons
- Visual course structure tree

### Phase 3: Content Creation Interface (Upcoming)
- File upload with drag-drop
- Content type selection and metadata
- Rich text editor for text content
- Markdown editor with preview
- Video/PDF content management

### Phase 4: Advanced Features (Future)
- Bulk operations (duplicate, move, archive)
- Course templates
- Content preview system
- Analytics and usage tracking

## File Structure

```
frontend-next/
├── components/
│   ├── cms/
│   │   └── CourseManagerDashboard.tsx  # Main dashboard component
│   ├── AppLayout.tsx                   # Layout with navigation
│   └── AppNavigation.tsx               # Navigation component
├── app/
│   └── cms/
│       └── page.tsx                    # CMS route
└── ...
```

## API Integration

The dashboard integrates with these backend endpoints:
- `GET /api/cms/courses` - List courses with filtering
- `POST /api/cms/courses` - Create new course
- `PUT /api/cms/courses/:id` - Update course
- `DELETE /api/cms/courses/:id` - Delete course
- `GET /api/cms/courses/:id` - Get single course with full structure

## Authentication & Authorization

- **Authentication**: JWT token stored in localStorage
- **Authorization**: Course creator permissions checked on backend
- **Access Control**: CMS menu only appears for users with permissions
- **Error Handling**: Graceful fallback for permission errors

## Development Notes

- Uses Lucide React icons (already installed)
- Tailwind CSS for styling
- TypeScript for type safety
- Client-side routing with Next.js 15
- Optimistic UI updates for better UX
- Mobile-responsive design

## Troubleshooting

### "Access Denied" Error
- User doesn't have creator permissions
- Check `course_creators` table in database
- Contact admin to grant permissions

### API Errors
- Verify backend server is running on port 3001
- Check authentication token in localStorage
- Review network requests in browser dev tools

### Navigation Issues
- Ensure user is logged in
- Check localStorage for `authToken`, `userId`, `userName`, `userEmail`
- Verify JWT token hasn't expired
