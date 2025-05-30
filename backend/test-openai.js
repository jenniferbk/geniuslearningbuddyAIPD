// Simple test script to verify OpenAI API key
require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  console.log('Testing OpenAI API connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ No OPENAI_API_KEY found in .env file');
    return;
  }
  
  console.log('✓ API key found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello!' }],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ OpenAI API test successful!');
    console.log('Response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testOpenAI();
