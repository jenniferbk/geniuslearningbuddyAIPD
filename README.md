# 🤖 AI Learning Buddy - Primer-like Learning Companion

A sophisticated AI learning companion for K-12 teacher AI literacy education, inspired by Neal Stephenson's Primer from *The Diamond Age*. Built as part of doctoral research on AI-enhanced learning companions.

## ✨ **Key Features**

### 🧠 **Primer-like Intelligence**
- **Silent memory updates** that happen in the background
- **Adaptive personality** based on tech comfort and teaching context
- **Deep relationship building** that grows over time
- **Emotional intelligence** recognizing frustration, excitement, breakthroughs
- **Teaching context awareness** specific to grade level and subjects

### 📊 **Research Infrastructure**
- **Comprehensive interaction logging** for doctoral research
- **Memory evolution tracking** and learning progression analysis
- **Emotional state detection** and implementation intent monitoring
- **Research analytics dashboard** for data analysis

### 🎯 **Educational Focus**
- **K-12 teacher AI literacy** curriculum and support
- **Practical classroom applications** of AI tools
- **Scaffolded learning** adapted to individual comfort levels
- **Implementation guidance** from exploration to practice

### 📚 **Content Management System**
- **Course creation dashboard** with visual management interface
- **Multi-format content support** (videos, PDFs, text, markdown, images)
- **Drag-drop course structure** building (courses → modules → lessons → content)
- **Permission-based access** for content creators and educators
- **YouTube integration** with transcript-aware AI conversations
- **Progress tracking** and learning analytics
- **Content-aware AI chat** that references specific video timestamps

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ 
- OpenAI API key
- SQLite

### **Installation**

1. **Clone and install:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-learning-buddy.git
   cd ai-learning-buddy
   
   # Backend setup
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your OpenAI API key
   
   # Frontend setup
   cd ../frontend
   npm install
   ```

2. **Set up database:**
   ```bash
   cd backend
   node setup-database.js
   node database-enhancements.js
   node -e "require('./database-enhancements.js').setupResearchLogging()"
   ```

3. **Launch the application:**
   ```bash
   # Backend (terminal 1)
   cd backend
   npm start
   
   # Frontend (terminal 2)  
   cd frontend
   npm start
   ```

4. **Set up CMS database (optional):**
   ```bash
   cd backend
   ./setup-cms-full.sh  # One-command setup!
   # OR manually: node setup-cms-database.js
   ```
   See [CMS_QUICK_SETUP.md](./CMS_QUICK_SETUP.md) for detailed setup options.

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/api/health
   - **CMS Dashboard: http://localhost:3000/cms** (requires creator permissions)

### **Getting CMS Access**

**✅ Super Simple:** All users automatically get creator permissions!

1. **Register/login** at `http://localhost:3000`
2. **Click "Content Manager"** in the navigation
3. **Start creating courses!** 🎓

*That's it! No permission setup needed.*

For detailed CMS usage, see [CMS_README.md](./CMS_README.md)  
For setup options, see [CMS_QUICK_SETUP.md](./CMS_QUICK_SETUP.md)

## 🎭 **The Primer Experience**

### **What Makes It Special:**

**Silent Intelligence:** Memory updates happen invisibly, like the Primer's subtle awareness. No intrusive "Learned about: ai" popups.

**Contextual Understanding:** Remembers your teaching challenges, grade level, subject focus, and emotional journey with AI.

**Adaptive Personality:** Communication style adapts to your tech comfort level:
- **Low tech comfort:** Patient, step-by-step, simple language
- **High tech comfort:** Advanced concepts, technical precision
- **Teaching context:** Examples specific to your grade level and subjects

**Emotional Intelligence:** Recognizes and responds to:
- Frustration with technology or student challenges
- Excitement about AI possibilities  
- Conceptual breakthroughs and "aha!" moments
- Implementation readiness and planning

**Progressive Relationship:** References your shared learning journey, celebrates growth, and builds on established understanding.

## 📈 **Research Value**

This platform captures rich longitudinal data on:

- **Teacher AI literacy development patterns**
- **Memory-enhanced learning companion effectiveness**
- **Adaptive personality impact on engagement**
- **Primer-like relationship building in education**
- **Emotional states and learning progression markers**

Perfect for methodology papers on AI learning companions!

## 🔧 **Technical Architecture**

### **Enhanced Memory System:**
- **Semantic clustering** of teaching challenges and learning states
- **Relationship mapping** between concepts, emotions, and implementations  
- **Contextual retrieval** based on current conversation and teaching profile
- **Progressive understanding** that deepens over time

### **Research Logging:**
- **Interaction tracking** with memory updates and emotional states
- **Learning analytics** with breakthrough detection and engagement patterns
- **Memory evolution monitoring** to track AI understanding development
- **Research dashboard** at `/api/research/analytics`

### **Adaptive AI System:**
- **Dynamic system prompts** based on user profile and conversation history
- **Teaching context integration** with grade level and subject awareness
- **Emotional state responsiveness** for frustration, excitement, confusion
- **Implementation scaffolding** from exploration to classroom practice

## 🔍 **Monitoring & Debug**

### **Debug Endpoints:**
- **Memory system health:** `/api/debug/memory/USER_ID`
- **Conversation analysis:** `/api/debug/conversations/USER_ID`  
- **Research analytics:** `/api/research/analytics` (authorized users)

### **Console Monitoring:**
- Memory updates logged silently: `🧠 Memory Updates (Silent): [...]`
- Research logging status in browser console
- Server logs show enhanced memory processing

## 📚 **Research Documentation**

See `docs/RESEARCH.md` for detailed research methodology, data collection procedures, and analysis frameworks.

## 🛡️ **Privacy & Security**

- **Local data storage** with SQLite database
- **Research-grade logging** with comprehensive interaction tracking
- **Environment variable protection** for API keys
- **Private repository** recommended for research data protection

## 🎯 **Testing the Experience**

1. **Express a teaching challenge:** "My 5th graders struggle with math engagement"
2. **Later conversations:** AI should remember your grade level, subject, and specific challenges
3. **Show implementation interest:** "I want to try using AI for lesson planning"
4. **Future discussions:** AI should reference your implementation plans and provide scaffolded support

## 🔮 **Future Development**

- Additional learning modules beyond basic AI literacy
- Enhanced classroom simulation features
- Advanced analytics for research studies  
- Multi-teacher cohort support for research
- Integration with education technology platforms

## 📖 **Inspiration**

> *"The Primer was not a book but a computer that taught. It was a wise and wonderful thing that would teach little girls and boys how to think."* 
> 
> — Neal Stephenson, The Diamond Age

This AI Learning Buddy aims to be that wise and wonderful companion for teachers learning to navigate the age of AI in education.

---

**Built for doctoral research in Mathematics Education**  
**Contributing to the future of AI-enhanced learning companions** 🎓✨