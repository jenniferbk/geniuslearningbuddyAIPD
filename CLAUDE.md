# Claude Code Agent Briefing - AI Learning Buddy Platform

## Project Overview

Building a **Coursera-like learning platform with integrated AI learning buddy** for K-12 teacher professional development in AI literacy. This is doctoral research software studying how AI-enhanced learning companions support teacher learning.

**Core Vision:** Replicate Coursera's course structure + Add AI buddy that knows what content the user is viewing/reading and provides contextual help in a chat window.

## Current State Assessment

### Two Project Directories (Confusing - Needs Consolidation)
1. `/Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD` - Main codebase
2. `/Users/jenniferkleiman/Documents/AILiteracyProject` - Has working .env and database

### What Exists and Works
- ✅ **Backend authentication** (JWT-based)
- ✅ **OpenAI chat integration** (GPT-4o-mini)
- ✅ **Semantic memory system** (sentence-transformers)
- ✅ **SQLite database** with user, conversation, memory tables
- ✅ **Research logging** for doctoral analysis
- ✅ **Basic Express server** structure

### What's Broken/Unstable
- ❌ **Video player** - 11 different versions, none stable
- ❌ **Content-aware chat** - Partially implemented, not working
- ❌ **Course structure** - Only scaffolding exists
- ❌ **Path issues** - Scripts hardcoded to wrong directories
- ❌ **Frontend** - React app exists but messy, needs rebuild

## Technical Stack Decisions

### Backend (Keep Existing)
- **Node.js + Express** - Already working
- **SQLite** - Good for single-user research prototype
- **OpenAI API** - GPT-4o-mini for cost efficiency
- **Semantic Memory** - @xenova/transformers with all-MiniLM-L6-v2

### Frontend (Rebuild Fresh)
- **Next.js 14** - Better than current React setup
- **Tailwind CSS** - Replace scattered CSS files
- **Shadcn/ui** - Professional components
- **React Player or native HTML5** - Not custom video player

## Core Features Required

### 1. Course Structure (Coursera-like)
```
Course
├── Module 1
│   ├── Lesson 1.1 (Video)
│   ├── Lesson 1.2 (Reading/PDF)
│   ├── Lesson 1.3 (Interactive)
│   └── Quiz
├── Module 2
│   └── ...
└── Progress Tracking
```

### 2. Content Viewer (Left Panel)
- **Video player** with progress tracking
- **PDF viewer** for documents
- **Text/Markdown** renderer for readings
- **Navigation** between lessons
- **Progress bar** showing completion

### 3. AI Learning Buddy (Right Panel)
- **Context-aware chat** that knows current content
- **Timestamp references** ("At 3:42 they discuss...")
- **Proactive help** based on viewing patterns
- **Memory of past interactions** across sessions
- **Personalized to teacher profile** (grade, subject, tech comfort)

### 4. Content Awareness System
- System must know:
  - What content user is viewing (video timestamp, PDF page, text section)
  - User's progress through course
  - Questions asked about specific content
  - Concepts extracted from content
- AI responses should reference:
  - Current content context
  - Previous lessons learned
  - Teacher's specific classroom context

## Database Schema Needed

### Existing Tables (Keep)
- `users` - Authentication and profiles
- `conversations` - Chat history
- `memory_entities` - Semantic memory storage
- `memory_relations` - Concept relationships
- `research_logs` - Doctoral research tracking

### New Tables Required
```sql
-- Course structure
courses (id, title, description, created_at)
modules (id, course_id, title, order_index)
lessons (id, module_id, title, type, content_url, order_index)

-- User progress
user_progress (user_id, lesson_id, completed, progress_percent, last_accessed)
user_quiz_scores (user_id, quiz_id, score, attempts)

-- Content awareness
content_chunks (id, lesson_id, chunk_text, start_time, end_time, keywords)
content_embeddings (chunk_id, embedding_vector)
user_content_interactions (user_id, chunk_id, interaction_type, timestamp)
```

## File Structure (Recommended)

```
/geniuslearningbuddyAIPD
├── /backend
│   ├── /api
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── courses.js
│   │   └── progress.js
│   ├── /services
│   │   ├── memory-service.js (KEEP EXISTING)
│   │   ├── content-awareness.js
│   │   └── openai-service.js
│   ├── /database
│   │   ├── schema.sql
│   │   └── migrations/
│   ├── server.js
│   └── .env
├── /frontend
│   ├── /app (Next.js 14 app directory)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── /courses
│   │       └── [courseId]/
│   │           └── [lessonId]/
│   │               └── page.tsx
│   ├── /components
│   │   ├── CourseNav.tsx
│   │   ├── ContentViewer.tsx
│   │   ├── ChatPanel.tsx
│   │   └── ProgressBar.tsx
│   └── /lib
│       └── api.ts
└── /content
    └── /courses
        └── /ai-literacy-basics
            ├── course.json
            ├── /videos
            ├── /pdfs
            └── /readings
```

## Critical Implementation Notes

### Authentication Flow
1. User registers with teacher profile (grade, subject, tech_comfort)
2. JWT token stored in localStorage
3. All API calls include Bearer token
4. Profile used for AI personalization

### Content Awareness Flow
1. User navigates to lesson
2. Frontend tracks video timestamp/PDF page/scroll position
3. Every 30 seconds or on pause, position sent to backend
4. Backend retrieves relevant content chunk
5. Chat includes content context in system prompt
6. AI references specific timestamps/sections

### Memory System (Existing - Don't Break)
- Semantic extraction happens on each message
- Entities created for concepts, challenges, emotions
- Relations track understanding progression
- Memory context built from entity graph
- Used to personalize future interactions

## Research Requirements

### Must Track for Doctoral Research
- Timestamp of every interaction
- Content being viewed during questions
- Time spent on each lesson
- Question types and complexity
- AI response effectiveness
- Learning progression indicators
- Emotional state markers

### Data Exports Needed
- Conversation transcripts with timestamps
- Progress completion data
- Concept extraction results
- Memory evolution over time
- Engagement metrics

## Known Pitfalls to Avoid

1. **Don't rebuild memory system** - It works, uses sophisticated semantic embeddings
2. **Don't use custom video player** - Use proven library or native HTML5
3. **Fix path issues** - Use relative paths or environment variables
4. **Don't over-engineer** - MVP first, enhance later
5. **Keep SQLite** - Good enough for research prototype
6. **Maintain research logging** - Critical for doctoral work

## Quick Start for Development

```bash
# Use the working directory
cd /Users/jenniferkleiman/Documents/AILiteracyProject

# Backend
cd backend
npm install
npm run dev  # Runs on port 3001

# Frontend (if using existing React)
cd ../frontend  
npm install
npm start  # Runs on port 3000

# Or for new Next.js frontend
npx create-next-app@latest frontend-next --typescript --tailwind --app
```

## Environment Variables Needed

```env
# Backend .env
OPENAI_API_KEY=sk-...
JWT_SECRET=random_secret_key
PORT=3001
NODE_ENV=development

# Frontend .env.local  
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Definition of Success (MVP)

1. User can register and login
2. User sees course with modules and lessons
3. User can watch videos and read PDFs
4. Chat panel shows on right side
5. AI knows what content user is viewing
6. AI provides contextual help based on content
7. System remembers past conversations
8. Progress is tracked and saved
9. Research data is logged

## Sample Test Flow

1. Teacher registers (5th grade, science, medium tech comfort)
2. Navigates to "AI Literacy Basics" course
3. Watches "Introduction to AI" video
4. At 2:30, asks "How would I explain this to my students?"
5. AI responds with grade-appropriate explanation
6. Teacher moves to next lesson (PDF reading)
7. Asks about implementation ideas
8. AI references both video and PDF content
9. Progress shows 2/10 lessons complete
10. Logout and login - progress persists

## Priority Order

1. **First:** Get basic course structure displaying
2. **Second:** Add content viewer (video/PDF)
3. **Third:** Integrate existing chat API
4. **Fourth:** Add content awareness
5. **Fifth:** Polish UI and fix bugs

## Key Research Context

This system is for Jennifer's doctoral dissertation on AI-enhanced learning companions for teacher professional development. The focus is on:
- How memory-enhanced AI supports learning
- Role of content awareness in educational AI
- Teacher AI literacy development patterns
- Emotional and cognitive support in PD

Every feature should consider: "What research data does this generate?"

---

**Remember:** This is research software for studying AI learning companions, not a commercial product. Functional MVP is more important than perfect polish. The existing semantic memory system is sophisticated and should be preserved.