// debug-auth.js - Debug authentication token issues
console.log('🔍 Debugging Authentication Token Issues...');
console.log('=====================================');
console.log('');

// Check what's in localStorage
console.log('📦 Current localStorage contents:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`   ${key}: ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
}

console.log('');

// Check specific token key
const token = localStorage.getItem('token');
console.log('🎫 Token check:');
console.log(`   Token exists: ${!!token}`);
console.log(`   Token length: ${token?.length || 0}`);
console.log(`   Token preview: ${token?.substring(0, 20)}...`);

console.log('');

// Check if we're on the right domain
console.log('🌐 Domain check:');
console.log(`   Current origin: ${window.location.origin}`);
console.log(`   Current pathname: ${window.location.pathname}`);

console.log('');

// Test token storage
console.log('🧪 Testing token storage...');
const testToken = 'test-token-' + Date.now();
localStorage.setItem('debug-token', testToken);
const retrievedToken = localStorage.getItem('debug-token');
console.log(`   Stored: ${testToken}`);
console.log(`   Retrieved: ${retrievedToken}`);
console.log(`   Storage working: ${testToken === retrievedToken}`);

// Clean up test
localStorage.removeItem('debug-token');

console.log('');
console.log('💡 Try this manual test:');
console.log('1. Open Dev Tools → Application → Local Storage → localhost:3000');
console.log('2. Look for a "token" entry');
console.log('3. If missing, try logging in again and watch for it to appear');
console.log('4. Check if anything is clearing it immediately after login');
