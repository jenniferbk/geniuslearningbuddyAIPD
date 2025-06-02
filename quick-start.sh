#!/bin/bash

echo "🧹 Cleaning and setting up AI Learning Buddy..."

# Navigate to backend
cd /Users/jenniferkleiman/Documents/AILiteracyProject/backend

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Populating video content chunks..."
node populate-video-data.js

echo "🚀 Starting server..."
npm start

echo "✅ Setup complete! Check the server output above."