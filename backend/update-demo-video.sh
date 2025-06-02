#!/bin/bash

echo "🔄 Updating to New Demo Video (p09yRj47kNM)"
echo "============================================="
echo ""

# Change to backend directory
cd /Users/jenniferkleiman/Documents/AILiteracyProject/backend

echo "📁 Current directory: $(pwd)"
echo ""

# Clear old video data and setup new video
echo "🗄️ Updating database with new video content..."
node setup-content-aware-database.js
echo ""

# Test the new setup
echo "🧪 Testing new video setup..."
node test-content-aware.js
echo ""

echo "🎉 Video update complete!"
echo ""
echo "📺 New demo video: p09yRj47kNM"
echo ""
echo "🚀 Ready to test! Run:"
echo "   Backend: npm run dev"
echo "   Frontend: cd ../frontend && npm start"
echo "   Then test the Content Demo with your new video!"
