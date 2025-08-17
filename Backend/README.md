# AI Meeting Notes Summarizer Backend

This is the backend server for the AI-powered meeting notes summarizer and sharer application using Google's Gemini AI.

## Features

- **AI-Powered Summarization**: Uses Google Gemini Pro for intelligent meeting analysis
- **File Upload Support**: Accepts text, PDF, and Word document uploads (TXT, MD, PDF, DOC, DOCX)
- **Custom Prompts**: Allows users to specify custom instructions for summarization
- **Email Sharing**: Sends generated summaries via email to multiple recipients
- **RESTful API**: Clean, well-documented API endpoints

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### Summarization
- `POST /api/summarize` - Generate summary from text input
- `POST /api/summarize-upload` - Generate summary from uploaded file

### Email
- `POST /api/send-email` - Send summary via email

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   - Copy `env.example` to `.env`
   - Fill in your Gemini API key and email credentials

3. **Gemini AI Setup**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an account and get your API key
   - Add the key to `.env` as `GEMINI_API_KEY`

4. **Email Setup (Gmail)**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password
   - Add your email and app password to `.env`

5. **Run the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `EMAIL_USER`: Your Gmail address
- `EMAIL_APP_PASSWORD`: Your Gmail app password

## Dependencies

- **Express.js**: Web framework
- **Google Generative AI**: Gemini AI model integration
- **Nodemailer**: Email sending
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **pdf-parse**: PDF text extraction
- **mammoth**: Word document text extraction

## File Upload Limits

- Maximum file size: 10MB
- Supported formats: TXT, MD, PDF, DOC, DOCX
- **Text files**: Direct processing
- **PDF files**: Text extraction using pdf-parse
- **Word documents**: Text extraction using mammoth

## Error Handling

The API includes comprehensive error handling for:
- Invalid file uploads
- Missing required fields
- Gemini AI API errors
- Email sending failures
- File processing errors
