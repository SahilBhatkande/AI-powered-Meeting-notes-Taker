const https = require('https');
const http = require('http');

console.log('🌐 Testing Network Connectivity...\n');

// Test basic internet connectivity
async function testBasicConnectivity() {
  console.log('1️⃣ Testing basic internet connectivity...');
  
  try {
    const response = await fetch('https://httpbin.org/get');
    if (response.ok) {
      console.log('✅ Basic internet connectivity: OK');
    } else {
      console.log('⚠️  Basic internet connectivity: Limited');
    }
  } catch (error) {
    console.log('❌ Basic internet connectivity: Failed');
    console.log('   Error:', error.message);
  }
}

// Test Google services connectivity
async function testGoogleConnectivity() {
  console.log('\n2️⃣ Testing Google services connectivity...');
  
  try {
    const response = await fetch('https://www.google.com');
    if (response.ok) {
      console.log('✅ Google services: OK');
    } else {
      console.log('⚠️  Google services: Limited');
    }
  } catch (error) {
    console.log('❌ Google services: Failed');
    console.log('   Error:', error.message);
  }
}

// Test Gemini API endpoint
async function testGeminiEndpoint() {
  console.log('\n3️⃣ Testing Gemini API endpoint...');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Gemini API endpoint: Accessible');
    } else {
      console.log('⚠️  Gemini API endpoint: Limited access');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Gemini API endpoint: Failed');
    console.log('   Error:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 This suggests a network connectivity issue:');
      console.log('   - Check your firewall settings');
      console.log('   - Verify corporate network policies');
      console.log('   - Try from a different network');
    }
  }
}

// Test with timeout
async function testWithTimeout() {
  console.log('\n4️⃣ Testing with timeout...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Timeout test: OK');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Timeout test: Request timed out after 10 seconds');
    } else {
      console.log('❌ Timeout test: Failed');
      console.log('   Error:', error.message);
    }
  }
}

// Main test function
async function runNetworkTests() {
  try {
    await testBasicConnectivity();
    await testGoogleConnectivity();
    await testGeminiEndpoint();
    await testWithTimeout();
    
    console.log('\n📊 Network Test Summary:');
    console.log('If you see multiple ❌ errors, this indicates:');
    console.log('   - Network connectivity issues');
    console.log('   - Firewall blocking external requests');
    console.log('   - Corporate network restrictions');
    console.log('   - Proxy configuration problems');
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your internet connection');
    console.log('2. Verify firewall settings');
    console.log('3. Check corporate network policies');
    console.log('4. Try from a different network (mobile hotspot)');
    console.log('5. Contact your network administrator');
    
  } catch (error) {
    console.error('❌ Network test failed:', error.message);
  }
}

// Run the tests
runNetworkTests();
