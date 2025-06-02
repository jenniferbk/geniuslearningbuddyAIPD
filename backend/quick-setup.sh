#!/bin/bash

echo "🚀 Quick Content-Aware Setup"
echo "================================"
echo ""

# Change to backend directory
cd /Users/jenniferkleiman/Documents/AILiteracyProject/backend

echo "📁 Current directory: $(pwd)"
echo ""

# Test current state
echo "🧪 Testing current database state..."
node test-content-aware.js
echo ""

# Run database setup
echo "🗄️ Setting up video content database..."
node setup-content-aware-database.js
echo ""

# Test again
echo "✅ Testing after setup..."
node test-content-aware.js
echo ""

echo "🎉 Setup complete!"
echo ""
echo "🔥 Ready to test! Run these commands:"
echo "   Backend: npm run dev"
echo "   Frontend: cd ../frontend && npm start"
echo "   Then go to Content Demo and test the video!"
