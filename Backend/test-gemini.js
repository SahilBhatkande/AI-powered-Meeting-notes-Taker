require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🧪 Testing Gemini API Connection...\n');

// Check if API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY found');
console.log('🔑 API Key (first 10 chars):', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

// Test the API key
async function testGemini() {
  try {
    console.log('\n🔄 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('✅ Gemini AI initialized successfully');
    
    console.log('\n🔄 Testing with a simple prompt...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent("Hello! Please respond with 'Gemini is working!' and nothing else.");
    const response = result.response.text();
    
    console.log('✅ API call successful!');
    console.log('📝 Response:', response);
    
    console.log('\n🎉 Gemini API is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n💡 This usually means:');
      console.error('   - Your API key is incorrect');
      console.error('   - You\'re using the wrong type of API key');
      console.error('   - You need to get a key from Google AI Studio, not Google Cloud Console');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.error('\n💡 This means you\'ve exceeded your API usage limits');
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      console.error('\n💡 This means the model name is incorrect');
    } else {
      console.error('\n💡 Check the error details above for more information');
    }
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Visit https://makersuite.google.com/app/apikey');
    console.error('2. Create a new API key specifically for Gemini');
    console.error('3. Make sure you\'re using the key from Google AI Studio, not Google Cloud Console');
    console.error('4. Update your .env file with the new key');
    
    process.exit(1);
  }
}

testGemini();
