// Test CMS Functionality
// Run this after setting up the database to verify everything works

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  gradeLevel: 'elementary',
  subjects: ['Math', 'Science'],
  techComfort: 'medium'
};

let authToken = null;

async function testCMS() {
  console.log('🧪 Testing AI Learning Buddy CMS...\n');

  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', health.data);

    // 2. Register or login test user
    console.log('\n2. Testing authentication...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
      authToken = registerResponse.data.token;
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 400) {
        // User already exists, try login
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        authToken = loginResponse.data.token;
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    // Set auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 3. Test CMS endpoints
    console.log('\n3. Testing CMS functionality...');

    // Test get courses (should be empty initially)
    const coursesResponse = await axios.get(`${BASE_URL}/api/cms/courses?my_courses=true`);
    console.log('✅ Courses fetched:', coursesResponse.data.length, 'courses found');

    // Test create course
    const courseData = {
      title: 'Test Course: AI Basics',
      description: 'A test course for verifying CMS functionality',
      learningObjectives: [
        'Understand basic AI concepts',
        'Learn about practical AI applications'
      ],
      estimatedDuration: 120,
      difficultyLevel: 'beginner'
    };

    const createCourseResponse = await axios.post(`${BASE_URL}/api/cms/courses`, courseData);
    console.log('✅ Course created:', createCourseResponse.data.title);
    const courseId = createCourseResponse.data.id;

    // Test create module
    const moduleData = {
      title: 'Introduction Module',
      description: 'Getting started with AI',
      learningObjectives: ['Define AI', 'Identify AI tools'],
      estimatedDuration: 60
    };

    const createModuleResponse = await axios.post(`${BASE_URL}/api/cms/courses/${courseId}/modules`, moduleData);
    console.log('✅ Module created:', createModuleResponse.data.title);
    const moduleId = createModuleResponse.data.id;

    // Test create lesson
    const lessonData = {
      title: 'What is AI?',
      description: 'Basic introduction to artificial intelligence',
      estimatedDuration: 30,
      lessonType: 'content'
    };

    const createLessonResponse = await axios.post(`${BASE_URL}/api/cms/modules/${moduleId}/lessons`, lessonData);
    console.log('✅ Lesson created:', createLessonResponse.data.title);
    const lessonId = createLessonResponse.data.id;

    // Test add text content
    const textContentData = {
      title: 'AI Definition',
      description: 'Understanding what AI means',
      contentType: 'text',
      metadata: {
        content: '# What is AI?\n\nArtificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence...'
      }
    };

    const createContentResponse = await axios.post(`${BASE_URL}/api/cms/lessons/${lessonId}/content/text`, textContentData);
    console.log('✅ Text content created:', createContentResponse.data.title);

    // Test get full course structure
    const fullCourseResponse = await axios.get(`${BASE_URL}/api/cms/courses/${courseId}`);
    console.log('✅ Full course structure retrieved');
    console.log('   - Course:', fullCourseResponse.data.title);
    console.log('   - Modules:', fullCourseResponse.data.modules?.length || 0);
    console.log('   - Lessons:', fullCourseResponse.data.modules?.[0]?.lessons?.length || 0);
    console.log('   - Content Items:', fullCourseResponse.data.modules?.[0]?.lessons?.[0]?.contentItems?.length || 0);

    // 4. Test AI chat (basic functionality)
    console.log('\n4. Testing AI chat integration...');
    const chatResponse = await axios.post(`${BASE_URL}/api/chat`, {
      message: 'Hello! Can you help me understand AI in education?',
      moduleContext: 'basic_ai_literacy'
    });
    console.log('✅ AI chat working:', chatResponse.data.response.substring(0, 100) + '...');

    console.log('\n🎉 All tests passed! CMS is working correctly.');
    console.log('\n📝 Summary:');
    console.log('• Authentication: ✅ Working');
    console.log('• Course creation: ✅ Working');
    console.log('• Module/Lesson creation: ✅ Working');
    console.log('• Content upload: ✅ Working');
    console.log('• AI chat: ✅ Working');
    console.log('\n🚀 Your colleagues can now create courses!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure backend is running: npm start');
    console.log('2. Check database setup: node setup-cms-database.js');
    console.log('3. Verify OpenAI API key in .env file');
    console.log('4. Check server logs for errors');
  }
}

// Run tests
if (require.main === module) {
  testCMS();
}

module.exports = { testCMS };