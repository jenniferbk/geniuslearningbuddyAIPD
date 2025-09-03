#!/bin/bash

# setup-cms-full.sh - Complete CMS setup script

echo "🚀 Setting up Complete CMS System..."

echo ""
echo "📋 Step 1: Setting up CMS database tables..."
node setup-cms-database.js

echo ""
echo "👥 Step 2: Granting creator permissions to all existing users..."
node grant-creator-permissions-to-all.js

echo ""
echo "🎉 CMS setup complete!"
echo ""
echo "✅ What's ready:"
echo "   • CMS database tables created"
echo "   • All existing users have creator permissions"
echo "   • All new users will automatically get creator permissions"
echo ""
echo "📍 Next steps:"
echo "   1. Start the backend: npm start"
echo "   2. Start the frontend: cd ../frontend-next && npm run dev"  
echo "   3. Navigate to: http://localhost:3000/cms"
echo ""
echo "🎓 Happy course creating!"
