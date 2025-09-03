#!/bin/bash

# Database Cleanup and Consolidation Script
# This script will consolidate databases and clean up the project

echo "🧹 Starting AI Learning Buddy Cleanup..."
echo "=================================="

cd /Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD/backend

# Step 1: Identify which database has data
echo "📊 Checking databases..."
if [ -f "learning_buddy.db" ]; then
    echo "✓ Found learning_buddy.db ($(du -h learning_buddy.db | cut -f1))"
fi
if [ -f "learning_buddy.db" ]; then
    echo "✓ Found learning_buddy.db ($(du -h learning_buddy.db | cut -f1))"
fi

# Step 2: List files that reference each database
echo ""
echo "📋 Database references in code:"
echo "Files using 'learning_buddy.db':"
grep -l "learning_buddy.db" *.js 2>/dev/null | head -10

echo ""
echo "Files using 'learning_buddy.db':"
grep -l "learning_buddy.db" *.js 2>/dev/null | head -10

# Step 3: List potential cleanup candidates
echo ""
echo "🗑️ Potential files to remove (test/debug/setup scripts):"
ls -la *test*.js *debug*.js *setup*.js *fix*.js *diagnose*.js 2>/dev/null | awk '{print $9}' | grep -v "^$"

echo ""
echo "🔧 Quick setup scripts:"
ls -la quick*.* setup*.sh 2>/dev/null | awk '{print $9}' | grep -v "^$"

echo ""
echo "=================================="
echo "📌 RECOMMENDED ACTIONS:"
echo ""
echo "1. DATABASE: Use 'learning_buddy.db' as the single database"
echo "   - Server.js already uses this"
echo "   - Delete learning_buddy.db if it's empty or outdated"
echo ""
echo "2. CLEANUP TEST FILES:"
echo "   Keep only:"
echo "   - server.js (main server)"
echo "   - cms-routes.js, cms-service.js (CMS functionality)"
echo "   - memory-service.js (AI memory)"
echo "   - content-aware-chat.js, video-content-routes.js (content features)"
echo "   - learning-modules.js, enhanced-prompts.js (AI features)"
echo ""
echo "3. AUTHENTICATION CONSISTENCY:"
echo "   - Use 'token' everywhere (not 'authToken')"
echo "   - Use '/auth' everywhere (not '/auth/login')"
echo ""
echo "Would you like me to generate a cleanup script? (Check the recommendations first)"
