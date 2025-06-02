#!/bin/bash

# setup-content-aware-system.sh - Complete setup for content-aware AI Learning Buddy

echo "🚀 Setting up Content-Aware AI Learning Buddy System..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "Usage: cd backend && ./setup-content-aware-system.sh"
    exit 1
fi

# Check for required files
echo "🔍 Checking required files..."
REQUIRED_FILES=(
    "server.js"
    "video-content-routes.js" 
    "content-aware-chat.js"
    "setup-content-aware-database.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done
echo "✅ All required files present"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env file found. Creating template..."
    cat > .env << EOL
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Configuration  
PORT=3001
NODE_ENV=development
EOL
    echo "📝 Created .env template - please add your OpenAI API key"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

# Check if new dependencies were added
echo ""
echo "🔍 Checking for content-aware dependencies..."
REQUIRED_DEPS=("axios" "cors" "express" "sqlite3" "bcrypt" "jsonwebtoken" "uuid")
MISSING_DEPS=()

for dep in "${REQUIRED_DEPS[@]}"; do
    if ! npm list "$dep" > /dev/null 2>&1; then
        MISSING_DEPS+=("$dep")
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "⚠️  Installing missing dependencies: ${MISSING_DEPS[*]}"
    npm install "${MISSING_DEPS[@]}"
fi

# Set up content-aware database
echo ""
echo "🗄️  Setting up content-aware database..."
node setup-content-aware-database.js

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Create uploads directory structure
echo ""
echo "📁 Creating upload directory structure..."
mkdir -p uploads/videos
mkdir -p uploads/pdfs
mkdir -p uploads/images
mkdir -p uploads/documents
echo "✅ Upload directories created"

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x setup-content-aware-system.sh
chmod +x validate-setup.sh
echo "✅ Scripts made executable"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Check for required frontend packages
FRONTEND_DEPS=("react-markdown")
for dep in "${FRONTEND_DEPS[@]}"; do
    if ! npm list "$dep" > /dev/null 2>&1; then
        echo "📦 Installing missing frontend dependency: $dep"
        npm install "$dep"
    fi
done

cd ../backend

# Create test content
echo ""
echo "📝 Creating test content for demo..."
cat > test-video-content.json << EOL
{
  "videoId": "intro_to_prompting",
  "title": "Introduction to AI Prompt Engineering",
  "description": "Learn the fundamentals of creating effective prompts for AI systems",
  "transcript": "Welcome to our introduction to AI prompt engineering. In this lesson, we'll explore the fundamentals of creating effective prompts for AI systems. Prompt engineering is the art and science of crafting input text that guides AI models to produce desired outputs. Think of it like learning to ask the right questions to get the best answers. Key principles include being specific, providing context, and iterating on your prompts. For example, instead of asking 'write a lesson plan,' you might ask 'create a 45-minute lesson plan for 3rd-grade students about ecosystems, including hands-on activities and assessment questions.' We'll practice these techniques throughout this course, helping you become more effective at integrating AI tools into your teaching practice."
}
EOL
echo "✅ Test content created"

# Run validation
echo ""
echo "🧪 Running system validation..."
if [ -f "validate-setup.sh" ]; then
    ./validate-setup.sh
else
    echo "⚠️  Validation script not found, skipping..."
fi

# Final instructions
echo ""
echo "🎉 Content-Aware AI Learning Buddy Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add your OpenAI API key to the .env file"
echo "2. Start the backend server: npm run dev"  
echo "3. Start the frontend server: cd ../frontend && npm start"
echo "4. Navigate to 'Content Demo' in the app to test content-aware features"
echo ""
echo "🔗 Endpoints Available:"
echo "• Backend: http://localhost:3001"
echo "• Frontend: http://localhost:3000"
echo "• Health Check: http://localhost:3001/api/health"
echo "• Content API: http://localhost:3001/api/content/video-context"
echo ""
echo "📚 Features Added:"
echo "• Timestamp-based RAG for videos"
echo "• Content-aware AI conversations"
echo "• Progress tracking on pause/completion"
echo "• Semantic memory integration"
echo "• Research logging enhancements"
echo ""
echo "🐛 Troubleshooting:"
echo "• Check console logs for any errors"
echo "• Verify .env file has valid OpenAI API key"
echo "• Run 'npm run dev' in backend and 'npm start' in frontend"
echo "• Use browser dev tools to check network requests"
echo ""
echo "Ready to test content-aware AI! 🎬🤖"