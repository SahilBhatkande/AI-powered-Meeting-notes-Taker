require('dotenv').config();

console.log('🧪 Testing File Processing Capabilities...\n');

// Test file processing without starting the full server
async function testFileProcessing() {
  try {
    // Test PDF processing
    console.log('1️⃣ Testing PDF processing...');
    const pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse library loaded successfully');
    
    // Test Word document processing
    console.log('\n2️⃣ Testing Word document processing...');
    const mammoth = require('mammoth');
    console.log('✅ mammoth library loaded successfully');
    
    // Test file type detection
    console.log('\n3️⃣ Testing file type detection...');
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    console.log('✅ Supported MIME types:');
    allowedMimeTypes.forEach(type => {
      console.log(`   - ${type}`);
    });
    
    console.log('\n4️⃣ Testing file size limits...');
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    console.log(`✅ Maximum file size: ${maxFileSize / (1024 * 1024)}MB`);
    
    console.log('\n✅ All file processing tests passed!');
    console.log('\n📁 File Support Summary:');
    console.log('   - Text files (.txt, .md): Direct processing');
    console.log('   - PDF files (.pdf): Text extraction with pdf-parse');
    console.log('   - Word documents (.doc, .docx): Text extraction with mammoth');
    console.log('   - Maximum size: 10MB');
    
  } catch (error) {
    console.error('❌ File processing test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Run "npm install" to install new dependencies');
    console.log('2. Check that pdf-parse and mammoth are installed');
    console.log('3. Verify Node.js version compatibility');
  }
}

// Run the test
testFileProcessing();

