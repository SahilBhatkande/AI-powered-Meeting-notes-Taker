const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  console.error('Please set GEMINI_API_KEY in your .env file');
  process.exit(1);
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
  console.warn('⚠️  Email credentials not fully configured');
  console.warn('Email functionality may not work properly');
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Support text, PDF, and Word documents
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only text, PDF, and Word documents are allowed'), false);
    }
  },
});

// File processing utility function
async function extractTextFromFile(file) {
  try {
    const buffer = file.buffer;
    const mimeType = file.mimetype;
    
    console.log(`📁 Processing file: ${file.originalname} (${mimeType})`);
    
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      // Handle text files
      const text = buffer.toString('utf-8');
      console.log(`✅ Text file processed successfully, length: ${text.length} characters`);
      return text;
      
    } else if (mimeType === 'application/pdf') {
      // Handle PDF files
      console.log('📄 Processing PDF file...');
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;
      console.log(`✅ PDF processed successfully, length: ${text.length} characters`);
      return text;
      
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/msword') {
      // Handle Word documents
      console.log('📝 Processing Word document...');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      console.log(`✅ Word document processed successfully, length: ${text.length} characters`);
      return text;
      
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
  } catch (error) {
    console.error('❌ Error processing file:', error.message);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

// Initialize Google Generative AI (Gemini)
let genAI;
try {
  // Configure Gemini with custom fetch options for network issues
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  process.exit(1);
}

// Configure nodemailer for email sending
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  },
  secure: true,
  port: 465
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Meeting Notes Summarizer Backend is running',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)
  });
});

// Generate summary from text
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript, customPrompt } = req.body;

    if (!transcript || !customPrompt) {
      return res.status(400).json({ 
        error: 'Transcript and custom prompt are required' 
      });
    }

    console.log('🤖 Generating summary with Gemini...');
    console.log('📝 Transcript length:', transcript.length, 'characters');
    console.log('🎯 Custom prompt:', customPrompt);

    // Create the system prompt
    const systemPrompt = `You are an expert meeting notes summarizer and business analyst. Your task is to create a comprehensive, well-structured summary that follows the user's specific requirements EXACTLY.

    CRITICAL INSTRUCTIONS:
    - ALWAYS follow the user's custom instructions precisely
    - Use clear, professional formatting with proper headings and bullet points
    - Extract and highlight the most important information from the transcript
    - Organize information logically and chronologically when relevant
    - Include key decisions, action items, deadlines, and responsibilities
    - Summarize main discussion points, conclusions, and next steps
    - Use business-appropriate language and tone
    - Ensure the summary is actionable and easy to understand
    - If the user asks for specific format (bullet points, executive summary, etc.), follow that format exactly
    - Focus on substance over style - prioritize content that matches the user's requirements`;

    // Combine the custom prompt with the transcript
    const userPrompt = `CUSTOM INSTRUCTIONS: ${customPrompt}

TRANSCRIPT:
${transcript}

TASK: Create a comprehensive summary that follows the custom instructions above EXACTLY. Ensure the summary is well-structured, professional, and addresses all requirements specified in the custom instructions.`;

    // Use Gemini Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('🔄 Calling Gemini API...');
    
    // Create timeout controller for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const result = await model.generateContent([
        systemPrompt,
        userPrompt
      ], {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const summary = result.response.text();
      console.log('✅ Summary generated successfully, length:', summary.length, 'characters');
      
      res.json({
        success: true,
        summary,
        originalTranscript: transcript,
        customPrompt
      });
      
    } catch (apiError) {
      clearTimeout(timeoutId);
      throw apiError;
    }

  } catch (error) {
    console.error('❌ Error generating summary:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate summary';
    if (error.message.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid Gemini API key. Please check your API key configuration.';
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      errorMessage = 'Gemini model not found. Please check the model configuration.';
    } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
      errorMessage = 'Network connection failed. Please check your internet connection and firewall settings.';
    } else if (error.message.includes('timeout') || error.name === 'AbortError') {
      errorMessage = 'Request timed out. Please try again or check your network connection.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Generate summary from uploaded file
app.post('/api/summarize-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { customPrompt } = req.body;
    
    if (!customPrompt) {
      return res.status(400).json({ error: 'Custom prompt is required' });
    }

    // Extract text from the uploaded file
    const transcript = await extractTextFromFile(req.file);

    // Create the system prompt
    const systemPrompt = `You are an expert meeting notes summarizer and business analyst. Your task is to create a comprehensive, well-structured summary that follows the user's specific requirements EXACTLY.

    CRITICAL INSTRUCTIONS:
    - ALWAYS follow the user's custom instructions precisely
    - Use clear, professional formatting with proper headings and bullet points
    - Extract and highlight the most important information from the transcript
    - Organize information logically and chronologically when relevant
    - Include key decisions, action items, deadlines, and responsibilities
    - Summarize main discussion points, conclusions, and next steps
    - Use business-appropriate language and tone
    - Ensure the summary is actionable and easy to understand
    - If the user asks for specific format (bullet points, executive summary, etc.), follow that format exactly
    - Focus on substance over style - prioritize content that matches the user's requirements`;

    // Combine the custom prompt with the transcript
    const userPrompt = `CUSTOM INSTRUCTIONS: ${customPrompt}

TRANSCRIPT:
${transcript}

TASK: Create a comprehensive summary that follows the custom instructions above EXACTLY. Ensure the summary is well-structured, professional, and addresses all requirements specified in the custom instructions.`;

    console.log('🤖 Generating summary from uploaded file with Gemini...');
    console.log('📁 File:', req.file.originalname, 'Size:', req.file.size, 'bytes');
    console.log('📝 Transcript length:', transcript.length, 'characters');
    console.log('🎯 Custom prompt:', customPrompt);

    // Use Gemini Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('🔄 Calling Gemini API...');
    
    // Create timeout controller for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const result = await model.generateContent([
        systemPrompt,
        userPrompt
      ], {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const summary = result.response.text();
      console.log('✅ Summary generated successfully, length:', summary.length, 'characters');
      
      res.json({
        success: true,
        summary,
        originalTranscript: transcript,
        customPrompt
      });
      
    } catch (apiError) {
      clearTimeout(timeoutId);
      throw apiError;
    }

  } catch (error) {
    console.error('❌ Error processing uploaded file:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process uploaded file';
    if (error.message.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid Gemini API key. Please check your API key configuration.';
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      errorMessage = 'Gemini model not found. Please check the model configuration.';
    } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
      errorMessage = 'Network connection failed. Please check your internet connection and firewall settings.';
    } else if (error.message.includes('timeout') || error.name === 'AbortError') {
      errorMessage = 'Request timed out. Please try again or check your network connection.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Send summary via email
app.post('/api/send-email', async (req, res) => {
  try {
    const { recipients, subject, summary, senderName } = req.body;

    if (!recipients || !summary) {
      return res.status(400).json({ 
        error: 'Recipients and summary are required' 
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = recipients.filter(email => emailRegex.test(email));

    if (validRecipients.length === 0) {
      return res.status(400).json({ 
        error: 'No valid email addresses provided' 
      });
    }

    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Summary</h2>
        <p><strong>From:</strong> ${senderName || 'AI Meeting Notes Summarizer'}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          ${summary.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This summary was generated using AI-powered meeting notes summarizer powered by Google Gemini.
        </p>
      </div>
    `;

    // Send email to each recipient
    const emailPromises = validRecipients.map(async (recipient) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: subject || 'Meeting Summary',
        html: emailContent,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Summary sent successfully to ${validRecipients.length} recipient(s)`,
      recipients: validRecipients
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'ESOCKET') {
      errorMessage = 'Email connection failed. Please check your Gmail settings and app password.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your Gmail username and app password.';
    } else if (error.message.includes('self-signed certificate')) {
      errorMessage = 'SSL certificate issue. Please check your network configuration.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Meeting Notes Summarizer Backend running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
