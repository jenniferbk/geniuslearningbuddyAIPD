#!/bin/bash

# AI Learning Buddy - Project Cleanup Script
# Run this after reviewing what will be deleted!

echo "🧹 AI Learning Buddy Comprehensive Cleanup"
echo "=========================================="
echo ""
echo "⚠️  This script will:"
echo "  1. Consolidate to single database (learning_buddy.db)"
echo "  2. Remove test/debug/setup files"
echo "  3. Clean up old scripts"
echo ""
read -p "Have you backed up your project? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cleanup cancelled. Please backup first!"
    exit 1
fi

cd /Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD/backend

echo ""
echo "Step 1: Database Consolidation"
echo "-------------------------------"

# Check which database has real data
if [ -f "learning_buddy.db" ] && [ -f "ai_literacy_buddy.db" ]; then
    SIZE_LEARNING=$(stat -f%z "learning_buddy.db" 2>/dev/null || stat -c%s "learning_buddy.db" 2>/dev/null)
    SIZE_AI=$(stat -f%z "ai_literacy_buddy.db" 2>/dev/null || stat -c%s "ai_literacy_buddy.db" 2>/dev/null)
    
    echo "📊 learning_buddy.db size: $SIZE_LEARNING bytes"
    echo "📊 ai_literacy_buddy.db size: $SIZE_AI bytes"
    
    if [ "$SIZE_AI" -gt "$SIZE_LEARNING" ]; then
        echo "⚠️  ai_literacy_buddy.db is larger. Backing up and switching..."
        mv learning_buddy.db learning_buddy.db.backup
        cp ai_literacy_buddy.db learning_buddy.db
        echo "✅ Copied ai_literacy_buddy.db to learning_buddy.db"
    else
        echo "✅ Keeping learning_buddy.db as primary (it's larger/main)"
    fi
    
    # Archive the old database
    mkdir -p archive
    mv ai_literacy_buddy.db archive/ai_literacy_buddy.db.old 2>/dev/null
    echo "📦 Archived ai_literacy_buddy.db"
fi

echo ""
echo "Step 2: Remove Test/Debug Files"
echo "--------------------------------"

# Move test and debug files to archive
mkdir -p archive/old-scripts

# Test files
for file in test-*.js create-test-*.js debug-*.js diagnose-*.js; do
    if [ -f "$file" ]; then
        mv "$file" archive/old-scripts/
        echo "📦 Archived: $file"
    fi
done

# Old setup scripts (keep only essential ones)
for file in setup-*.js; do
    # Keep only the main setup files
    if [[ "$file" != "setup-database.js" ]] && [[ "$file" != "setup-cms-database.js" ]]; then
        if [ -f "$file" ]; then
            mv "$file" archive/old-scripts/
            echo "📦 Archived: $file"
        fi
    fi
done

# Quick scripts and fix scripts
for file in quick-*.js fix-*.sh quick-*.sh; do
    if [ -f "$file" ]; then
        mv "$file" archive/old-scripts/
        echo "📦 Archived: $file"
    fi
done

# Cleanup scripts
for file in cleanup-*.js grant-*.js grant-*.sh populate-*.js validate-*.sh; do
    if [ -f "$file" ]; then
        mv "$file" archive/old-scripts/
        echo "📦 Archived: $file"
    fi
done

echo ""
echo "Step 3: Clean Frontend References"
echo "----------------------------------"

cd ../frontend-next

# Check for any remaining authToken or /auth/login references
echo "Checking for old auth references..."
grep -r "authToken" --include="*.tsx" --include="*.ts" . 2>/dev/null | head -5
grep -r "/auth/login" --include="*.tsx" --include="*.ts" . 2>/dev/null | head -5

if [ $? -eq 0 ]; then
    echo "⚠️  Found old auth references. Please fix manually."
else
    echo "✅ No old auth references found"
fi

echo ""
echo "Step 4: Essential Files Check"
echo "------------------------------"
cd ../backend

echo "✅ Essential backend files kept:"
ls -1 *.js | grep -E "^(server|cms-routes|cms-service|memory-service|content-aware-chat|video-content-routes|learning-modules|enhanced-prompts|youtube-transcript-service|primer-enhancements|database-enhancements)\.js$"

echo ""
echo "=========================================="
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "📋 Summary:"
echo "  - Database consolidated to: learning_buddy.db"
echo "  - Test/debug files moved to: backend/archive/old-scripts/"
echo "  - Old database backed up to: backend/archive/"
echo ""
echo "🔧 Next steps:"
echo "  1. Run: cd backend && npm start"
echo "  2. Run: cd frontend-next && npm run dev"
echo "  3. Test login at http://localhost:3000/auth"
echo "  4. Test CMS at http://localhost:3000/cms"
echo ""
echo "If everything works, you can delete the archive folder later."
