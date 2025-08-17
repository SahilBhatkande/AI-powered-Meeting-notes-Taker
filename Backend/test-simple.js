require('dotenv').config();

console.log('🧪 Testing Basic Backend Setup...\n');

// Test 1: Environment variables
console.log('1️⃣ Checking environment variables...');
if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY: Set');
  console.log('   Length:', process.env.GEMINI_API_KEY.length, 'characters');
  console.log('   Starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ GEMINI_API_KEY: Not set');
}

if (process.env.EMAIL_USER) {
  console.log('✅ EMAIL_USER: Set');
} else {
  console.log('⚠️  EMAIL_USER: Not set');
}

if (process.env.EMAIL_APP_PASSWORD) {
  console.log('✅ EMAIL_APP_PASSWORD: Set');
} else {
  console.log('⚠️  EMAIL_APP_PASSWORD: Not set');
}

// Test 2: Dependencies
console.log('\n2️⃣ Checking dependencies...');
try {
  const express = require('express');
  console.log('✅ Express: Loaded');
} catch (error) {
  console.log('❌ Express: Failed to load');
}

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  console.log('✅ GoogleGenerativeAI: Loaded');
} catch (error) {
  console.log('❌ GoogleGenerativeAI: Failed to load');
}

try {
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer: Loaded');
} catch (error) {
  console.log('❌ Nodemailer: Failed to load');
}

// Test 3: Basic Gemini initialization
console.log('\n3️⃣ Testing Gemini initialization...');
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI: Initialized successfully');
  
  // Test model availability
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  console.log('✅ Model: gemini-2.0-flash available');
  
} catch (error) {
  console.log('❌ Gemini AI: Initialization failed');
  console.log('   Error:', error.message);
}

// Test 4: Simple network test
console.log('\n4️⃣ Testing basic network connectivity...');
try {
  const https = require('https');
  const url = 'https://www.google.com';
  
  const req = https.get(url, (res) => {
    console.log('✅ Basic network: Google accessible');
    console.log('   Status:', res.statusCode);
  });
  
  req.on('error', (error) => {
    console.log('❌ Basic network: Failed to reach Google');
    console.log('   Error:', error.message);
  });
  
  req.setTimeout(5000, () => {
    console.log('⚠️  Basic network: Request timed out');
    req.destroy();
  });
  
} catch (error) {
  console.log('❌ Basic network: Test failed');
  console.log('   Error:', error.message);
}

console.log('\n📊 Test Summary:');
console.log('If you see ❌ errors, check:');
console.log('1. Environment variables in .env file');
console.log('2. Network connectivity');
console.log('3. Dependencies installation (npm install)');
console.log('4. Firewall/network restrictions');
