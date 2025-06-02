// test-server-startup.js - Quick test to check for syntax errors
console.log('🔍 Testing server startup...');

try {
  console.log('📝 Loading dependencies...');
  require('dotenv').config();
  const express = require('express');
  console.log('✅ Express loaded');
  
  console.log('📊 Loading database...');
  const sqlite3 = require('sqlite3').verbose();
  console.log('✅ SQLite loaded');
  
  console.log('🧠 Loading memory service...');
  const SemanticMemoryService = require('./memory-service');
  console.log('✅ Memory service loaded');
  
  console.log('🎬 Loading video content routes...');
  const videoContentRoutes = require('./video-content-routes');
  console.log('✅ Video content routes loaded');
  
  console.log('📄 Loading server.js syntax...');
  const path = require('path');
  const fs = require('fs');
  const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  
  // Try to parse the server code for syntax errors
  try {
    new Function(serverCode);
    console.log('✅ Server.js syntax is valid');
  } catch (syntaxError) {
    console.error('❌ SYNTAX ERROR in server.js:', syntaxError.message);
    console.error('Line:', syntaxError.line || 'unknown');
    process.exit(1);
  }
  
  console.log('🚀 Everything looks good! Try starting the server...');
  console.log('💡 Run: cd /Users/jenniferkleiman/Documents/AILiteracyProject/backend && npm run dev');
  
} catch (error) {
  console.error('❌ ERROR during startup test:', error.message);
  console.error('📍 Error details:', error);
  process.exit(1);
}
