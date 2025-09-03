#!/bin/bash

# validate-content-aware-setup.sh - Validation script for content-aware system

echo "🧪 Validating Content-Aware AI Learning Buddy Setup..."
echo ""

VALIDATION_ERRORS=0

# Function to report validation results
report_validation() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" = "PASS" ]; then
        echo "✅ $test_name"
        [ -n "$details" ] && echo "   $details"
    else
        echo "❌ $test_name"
        [ -n "$details" ] && echo "   $details"
        ((VALIDATION_ERRORS++))
    fi
}

# Test 1: Check backend files
echo "📁 Checking Backend Files..."
BACKEND_FILES=(
    "server.js:Updated server with content-aware features"
    "video-content-routes.js:Video content RAG routes"
    "content-aware-chat.js:Content-aware chat integration"
    "setup-content-aware-database.js:Database setup script"
)

for file_info in "${BACKEND_FILES[@]}"; do
    IFS=':' read -r file description <<< "$file_info"
    if [ -f "$file" ]; then
        report_validation "$description" "PASS" "Found: $file"
    else
        report_validation "$description" "FAIL" "Missing: $file"
    fi
done

# Test 2: Check frontend files
echo ""
echo "📱 Checking Frontend Files..."
FRONTEND_FILES=(
    "../frontend/src/components/VideoPlayer.js:Video player component"
    "../frontend/src/components/VideoPlayer.css:Video player styles"
    "../frontend/src/components/ContentViewer.js:Content viewer component"
    "../frontend/src/components/ContentViewer.css:Content viewer styles"
    "../frontend/src/components/ContentAwareChatDemo.js:Demo component"
    "../frontend/src/components/ContentAwareChatDemo.css:Demo component styles"
)

for file_info in "${FRONTEND_FILES[@]}"; do
    IFS=':' read -r file description <<< "$file_info"
    if [ -f "$file" ]; then
        report_validation "$description" "PASS" "Found: $file"
    else
        report_validation "$description" "FAIL" "Missing: $file"
    fi
done

# Test 3: Check database tables
echo ""
echo "🗄️  Checking Database Tables..."
if [ -f "learning_buddy.db" ]; then
    TABLES=(
        "video_content_chunks:Video content chunks for RAG"
        "user_video_progress:User progress tracking"
        "video_context_cache:Content context caching"
        "content_interactions:Content interaction logging"
    )
    
    for table_info in "${TABLES[@]}"; do
        IFS=':' read -r table description <<< "$table_info"
        if sqlite3 learning_buddy.db "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" | grep -q "$table"; then
            report_validation "$description" "PASS" "Table exists: $table"
        else
            report_validation "$description" "FAIL" "Missing table: $table"
        fi
    done
else
    report_validation "Database file" "FAIL" "learning_buddy.db not found"
fi

# Test 4: Check dependencies
echo ""
echo "📦 Checking Dependencies..."
BACKEND_DEPS=("express" "sqlite3" "axios" "cors" "bcrypt" "jsonwebtoken" "uuid")

for dep in "${BACKEND_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        report_validation "Backend dependency: $dep" "PASS"
    else
        report_validation "Backend dependency: $dep" "FAIL" "Run: npm install $dep"
    fi
done

# Test 5: Check environment configuration
echo ""
echo "⚙️  Checking Environment Configuration..."
if [ -f ".env" ]; then
    report_validation "Environment file" "PASS" ".env file exists"
    
    if grep -q "OPENAI_API_KEY=" .env; then
        if grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
            report_validation "OpenAI API Key" "WARN" "Default placeholder detected - update with real key"
        else
            report_validation "OpenAI API Key" "PASS" "API key configured"
        fi
    else
        report_validation "OpenAI API Key" "FAIL" "OPENAI_API_KEY not found in .env"
    fi
else
    report_validation "Environment file" "FAIL" ".env file missing"
fi

# Test 6: Check upload directories
echo ""
echo "📁 Checking Upload Directory Structure..."
UPLOAD_DIRS=("uploads" "uploads/videos" "uploads/pdfs" "uploads/images" "uploads/documents")

for dir in "${UPLOAD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        report_validation "Upload directory: $dir" "PASS"
    else
        report_validation "Upload directory: $dir" "FAIL" "Create with: mkdir -p $dir"
    fi
done

# Test 7: Syntax check for key files
echo ""
echo "🔍 Checking File Syntax..."

# Check JavaScript syntax
JS_FILES=("server.js" "video-content-routes.js" "content-aware-chat.js")
for js_file in "${JS_FILES[@]}"; do
    if [ -f "$js_file" ]; then
        if node -c "$js_file" 2>/dev/null; then
            report_validation "Syntax check: $js_file" "PASS"
        else
            report_validation "Syntax check: $js_file" "FAIL" "JavaScript syntax errors detected"
        fi
    fi
done

# Test 8: Check package.json scripts
echo ""
echo "📝 Checking Package Scripts..."
if [ -f "package.json" ]; then
    if grep -q '"dev"' package.json; then
        report_validation "Development script" "PASS" "npm run dev available"
    else
        report_validation "Development script" "WARN" "Consider adding 'dev' script to package.json"
    fi
    
    if grep -q '"start"' package.json; then
        report_validation "Start script" "PASS" "npm start available"
    else
        report_validation "Start script" "WARN" "Consider adding 'start' script to package.json"
    fi
fi

# Test 9: Check frontend configuration
echo ""
echo "🎨 Checking Frontend Configuration..."
if [ -f "../frontend/package.json" ]; then
    cd ../frontend
    
    if npm list react-markdown > /dev/null 2>&1; then
        report_validation "React Markdown dependency" "PASS"
    else
        report_validation "React Markdown dependency" "FAIL" "Run: npm install react-markdown"
    fi
    
    # Check for updated files
    if grep -q "contentContext" src/components/ChatInterface.js 2>/dev/null; then
        report_validation "ChatInterface content awareness" "PASS" "Content-aware features integrated"
    else
        report_validation "ChatInterface content awareness" "FAIL" "ChatInterface not updated for content awareness"
    fi
    
    cd ../backend
fi

# Final summary
echo ""
echo "📊 Validation Summary:"
echo "=============================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo "🎉 All validations passed! Content-aware system is ready."
    echo ""
    echo "🚀 To start the system:"
    echo "1. Backend: npm run dev (or node server.js)"
    echo "2. Frontend: cd ../frontend && npm start"
    echo "3. Visit: http://localhost:3000"
    echo "4. Click 'Content Demo' to test content-aware features"
    echo ""
    echo "🎬 Features to test:"
    echo "• Play the sample video in the demo"
    echo "• Ask questions about the content while watching"
    echo "• Notice how AI references specific timestamps"
    echo "• Try the sample questions provided"
else
    echo "⚠️  Found $VALIDATION_ERRORS validation error(s)"
    echo ""
    echo "🔧 To fix issues:"
    echo "1. Review the failed validations above"
    echo "2. Install missing dependencies"
    echo "3. Create missing files/directories"
    echo "4. Update configuration files"
    echo "5. Re-run this validation script"
fi

echo ""
echo "📞 For help:"
echo "• Check the setup logs above"
echo "• Review console output when starting servers"
echo "• Verify all file paths and permissions"
echo "• Ensure OpenAI API key is valid"

exit $VALIDATION_ERRORS