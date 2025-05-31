#!/bin/bash

# CMS Setup Validation Script
# Run this to check if everything is properly configured

echo "🔍 AI Learning Buddy CMS Setup Validation"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in backend directory. Please run from: Documents/AILiteracyProject/backend"
    exit 1
fi

echo "✅ In correct backend directory"

# Check required files exist
required_files=(
    "cms-service.js"
    "cms-routes.js" 
    "setup-cms-database.js"
    "test-cms.js"
    "ai_literacy_buddy.db"
)

echo ""
echo "📁 Checking required files:"
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

# Check upload directories
echo ""
echo "📂 Checking upload directories:"
upload_dirs=(
    "uploads"
    "uploads/videos"
    "uploads/pdfs"
    "uploads/images"
    "uploads/documents"
)

for dir in "${upload_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (missing)"
        mkdir -p "$dir"
        echo "   → Created $dir/"
    fi
done

# Check dependencies
echo ""
echo "📦 Checking dependencies:"
if npm list multer > /dev/null 2>&1; then
    echo "✅ multer installed"
else
    echo "❌ multer not installed"
    echo "   → Run: npm install multer"
fi

if npm list @xenova/transformers > /dev/null 2>&1; then
    echo "✅ @xenova/transformers installed"
else
    echo "❌ @xenova/transformers not installed"
fi

# Check .env file
echo ""
echo "🔐 Checking environment:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OPENAI_API_KEY configured"
    else
        echo "⚠️  OPENAI_API_KEY not found in .env"
    fi
else
    echo "❌ .env file missing"
    echo "   → Copy .env.example to .env and add your OpenAI API key"
fi

# Check database setup
echo ""
echo "🗄️  Checking database:"
if [ -f "ai_literacy_buddy.db" ]; then
    echo "✅ Database file exists"
    
    # Try to run a simple query to check if CMS tables exist
    if sqlite3 ai_literacy_buddy.db "SELECT name FROM sqlite_master WHERE type='table' AND name='courses';" | grep -q "courses"; then
        echo "✅ CMS tables exist"
    else
        echo "❌ CMS tables missing"
        echo "   → Run: node setup-cms-database.js"
    fi
else
    echo "❌ Database file missing"
    echo "   → Run: node setup-database.js first"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Fix any ❌ issues above"
echo "2. Run: node setup-cms-database.js"
echo "3. Run: npm start"
echo "4. Test: node test-cms.js"
echo "5. Start frontend and test Course Creator"

echo ""
echo "🆘 If you need help:"
echo "• Backend not starting: Check .env file and dependencies"
echo "• Database errors: Re-run setup-cms-database.js"
echo "• File upload errors: Check uploads/ directory permissions"
echo "• Frontend errors: Make sure backend is running on port 3001"