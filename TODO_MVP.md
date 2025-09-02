# AI Learning Buddy MVP - Development Roadmap

## Project Goal
Create a functional Coursera-like learning platform with an integrated AI buddy that provides context-aware assistance based on what content the user is viewing.

**Target Timeline:** 7-10 days to functional MVP

---

## Phase 0: Project Setup & Consolidation (Day 1)
*Goal: Clean working environment with all dependencies*

### Backend Consolidation
- [ ] Consolidate code into single directory `/Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD`
- [ ] Copy working `.env` from AILiteracyProject
- [ ] Copy populated `learning_buddy.db` from AILiteracyProject  
- [ ] Test backend starts successfully: `npm run dev`
- [ ] Verify health endpoint: `http://localhost:3001/api/health`
- [ ] Test existing chat endpoint with Postman/curl

### Frontend Decision & Setup
- [ ] Create fresh Next.js 14 frontend: `npx create-next-app@latest frontend-next --typescript --tailwind --app`
- [ ] Install required packages:
  ```bash
  npm install axios react-markdown lucide-react
  npm install @radix-ui/react-dialog @radix-ui/react-tabs
  npm install react-player pdfjs-dist
  ```
- [ ] Set up `.env.local` with API URL
- [ ] Create basic layout with split-pane view

### Content Directory Structure
- [ ] Create `/content/courses/ai-literacy-basics/` directory
- [ ] Add sample content:
  - [ ] 2-3 sample videos (or YouTube links)
  - [ ] 2-3 PDF documents
  - [ ] 2-3 markdown readings
- [ ] Create `course.json` with module/lesson structure

**Success Criteria:** Backend runs, frontend builds, sample content organized

---

## Phase 1: Course Structure & Navigation (Days 2-3)
*Goal: Display course structure and allow navigation between lessons*

### Database Schema
- [ ] Create new tables for course structure:
  ```sql
  -- courses, modules, lessons, user_progress
  ```
- [ ] Write migration script `migrations/001_course_structure.sql`
- [ ] Run migration to update database
- [ ] Create seed data for AI Literacy Basics course

### Backend API Endpoints
- [ ] `GET /api/courses` - List all courses
- [ ] `GET /api/courses/:id` - Get course with modules/lessons
- [ ] `GET /api/courses/:courseId/lessons/:lessonId` - Get specific lesson
- [ ] `POST /api/progress/:lessonId` - Update user progress
- [ ] `GET /api/progress/:courseId` - Get user's course progress

### Frontend Components
- [ ] Create course layout:
  ```
  /app/courses/[courseId]/layout.tsx - Split view container
  /app/courses/[courseId]/page.tsx - Course overview
  ```
- [ ] Build navigation components:
  - [ ] `CourseNav.tsx` - Sidebar with modules/lessons
  - [ ] `LessonCard.tsx` - Individual lesson display
  - [ ] `ProgressIndicator.tsx` - Shows completion
- [ ] Implement navigation between lessons
- [ ] Add progress tracking on lesson view

**Success Criteria:** Can see course structure, navigate between lessons, progress saves

---

## Phase 2: Content Viewer Implementation (Days 3-4)
*Goal: Display videos, PDFs, and text content*

### Content Viewer Component
- [ ] Create `ContentViewer.tsx` with type detection:
  ```typescript
  type ContentType = 'video' | 'pdf' | 'markdown' | 'text';
  ```
- [ ] Implement video player:
  - [ ] Use react-player for YouTube/MP4
  - [ ] Add progress tracking (play, pause, timestamp)
  - [ ] Send progress updates to backend
- [ ] Implement PDF viewer:
  - [ ] Use pdfjs for rendering
  - [ ] Track current page
  - [ ] Add page navigation controls
- [ ] Implement text/markdown viewer:
  - [ ] Use react-markdown for rendering
  - [ ] Track scroll position
  - [ ] Add reading time estimate

### Backend Content Serving
- [ ] `GET /api/content/:lessonId` - Get lesson content metadata
- [ ] Serve static files from `/content` directory
- [ ] Add content type detection
- [ ] Handle YouTube URLs vs local files

### Progress Tracking
- [ ] Track video timestamps on pause/skip
- [ ] Track PDF page numbers
- [ ] Track reading scroll percentage
- [ ] Save progress to database every 30 seconds

**Success Criteria:** Can view all content types, progress is tracked

---

## Phase 3: Chat Integration (Day 5)
*Goal: Add working chat panel connected to existing backend*

### Frontend Chat Panel
- [ ] Create `ChatPanel.tsx` component:
  - [ ] Message display area
  - [ ] Input field with send button
  - [ ] Loading states
  - [ ] Error handling
- [ ] Style with consistent design
- [ ] Add to course layout (right panel)

### Connect to Existing Chat API
- [ ] Use existing `/api/chat` endpoint
- [ ] Include JWT token in requests
- [ ] Display conversation history
- [ ] Handle streaming responses if available

### Enhance with User Context
- [ ] Pass user profile (grade, subject) to chat
- [ ] Include current lesson title in context
- [ ] Show "AI is typing..." indicator
- [ ] Add message timestamps

**Success Criteria:** Can chat with AI, sees responses, conversation persists

---

## Phase 4: Content Awareness (Days 6-7)
*Goal: Make AI aware of what user is viewing*

### Content Chunking System
- [ ] Create content processing pipeline:
  - [ ] Video: Extract transcript, chunk by timestamp
  - [ ] PDF: Extract text, chunk by page
  - [ ] Text: Chunk by section/paragraph
- [ ] Store chunks in database:
  ```sql
  content_chunks (id, lesson_id, chunk_text, start_time, end_time)
  ```
- [ ] Generate embeddings for chunks (use existing semantic system)

### Context Injection
- [ ] Modify chat endpoint to include:
  - [ ] Current content chunk based on timestamp/page
  - [ ] Surrounding context (previous/next chunk)
  - [ ] Lesson metadata
- [ ] Update system prompt with content context
- [ ] Test AI references specific timestamps

### Frontend Integration
- [ ] Send current position with each chat message:
  ```javascript
  { 
    message: "What does this mean?",
    context: {
      lessonId: "xxx",
      timestamp: 145, // or page: 5
      contentType: "video"
    }
  }
  ```
- [ ] Update ChatPanel to include context
- [ ] Show context indicator in UI ("Discussing video at 2:25")

**Success Criteria:** AI references specific content, provides contextual help

---

## Phase 5: Memory & Personalization (Day 8)
*Goal: Integrate existing memory system for personalization*

### Memory Integration
- [ ] Verify semantic memory service is working
- [ ] Test concept extraction from conversations
- [ ] Ensure memory updates happen silently
- [ ] Check memory persistence across sessions

### Personalized Responses
- [ ] Include memory context in chat prompts
- [ ] Reference previous lessons learned
- [ ] Adapt language to teacher's profile
- [ ] Show progression of understanding

### Testing Memory Features
- [ ] Ask about same concept across lessons
- [ ] Verify AI remembers previous discussions
- [ ] Test emotional state recognition
- [ ] Confirm research logging works

**Success Criteria:** AI remembers past interactions, responses are personalized

---

## Phase 6: Polish & Testing (Days 9-10)
*Goal: Fix bugs, improve UX, ensure research data collection*

### UI/UX Polish
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Mobile responsive design
- [ ] Keyboard shortcuts
- [ ] Add help tooltips

### Bug Fixes
- [ ] Test all content types thoroughly
- [ ] Fix any chat disconnection issues
- [ ] Ensure progress saves correctly
- [ ] Handle edge cases (network errors, etc.)

### Research Features
- [ ] Verify all interactions are logged
- [ ] Test data export endpoints
- [ ] Add research dashboard at `/api/research/analytics`
- [ ] Document data collection points

### Final Testing Checklist
- [ ] Complete user journey test:
  1. Register as new teacher
  2. Start course
  3. Watch video, ask questions
  4. Read PDF, ask questions  
  5. Complete several lessons
  6. Logout and login
  7. Verify progress and memory persist
- [ ] Load test with multiple lessons
- [ ] Test on different browsers
- [ ] Verify research data quality

**Success Criteria:** No critical bugs, smooth user experience, research data collected

---

## Deployment & Documentation (Optional - Day 11)

### Local Deployment
- [ ] Create start scripts for both frontend/backend
- [ ] Write user guide for teachers
- [ ] Document research data schema
- [ ] Create backup procedures

### Cloud Deployment (if needed)
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Set up PostgreSQL instead of SQLite
- [ ] Configure environment variables

---

## Quick Commands Reference

```bash
# Start everything
cd /Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend-next
npm run dev

# View at http://localhost:3000
```

## Definition of Done (MVP)

✅ A teacher can:
1. Register and create profile
2. Browse course with modules/lessons
3. Watch videos with progress tracking
4. Read PDFs and text content
5. Ask AI questions about content
6. Get contextual help based on what they're viewing
7. Have AI remember past conversations
8. See their progress through course
9. All interactions logged for research

## Critical Path Items

**Must Have for MVP:**
- Course structure display ✓
- Video/PDF viewing ✓
- Basic chat functionality ✓
- Content awareness ✓
- Progress tracking ✓

**Nice to Have (Post-MVP):**
- Quizzes and assessments
- Multiple courses
- Collaborative features
- Advanced analytics
- Mobile app

## Risk Mitigation

**Biggest Risks:**
1. **Video player issues** → Use react-player, not custom
2. **Memory system breaks** → Don't modify, just integrate
3. **Content awareness complex** → Start simple with just current timestamp
4. **Time constraints** → Focus on MVP features only

## Notes for Claude Code

- Prioritize working features over perfect code
- Use existing backend code where possible
- Don't over-engineer the frontend
- Keep research logging intact
- Test frequently with real content
- Comment code for future researchers

---

**Remember:** This is a research prototype. Functional > Beautiful. The goal is to study AI-enhanced learning, not build a commercial product.