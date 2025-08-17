<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Reactive state
const transcript = ref('')
const customPrompt = ref('')
const summary = ref('')
const editableSummary = ref('')
const isGenerating = ref(false)
const isEditing = ref(false)
const isSending = ref(false)
const activeTab = ref('text')
const uploadedFile = ref(null)
const fileInput = ref(null)
const senderName = ref('')
const emailSubject = ref('Meeting Summary')
const recipients = ref('')
const message = ref('')
const messageType = ref('success')

// Computed properties
const canGenerate = computed(() => {
  if (activeTab.value === 'text') {
    return transcript.value.trim() && customPrompt.value.trim()
  } else {
    return uploadedFile.value && customPrompt.value.trim()
  }
})

const canSendEmail = computed(() => {
  return summary.value && recipients.value.trim() && senderName.value.trim()
})

const formattedSummary = computed(() => {
  return summary.value.replace(/\n/g, '<br>')
})

// Methods
const setPrompt = (prompt) => {
  customPrompt.value = prompt
}

const showPromptGuide = () => {
  // Open the prompt guide in a new window/tab
  window.open('/prompt-examples.md', '_blank')
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      showMessage('File size must be less than 10MB', 'error')
      return
    }
    
    // Check file type
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      showMessage('File type not supported. Please upload .txt, .md, .pdf, .doc, or .docx files', 'error')
      return
    }
    
    uploadedFile.value = file
    
    // For text files, read content directly
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      const reader = new FileReader()
      reader.onload = (e) => {
        transcript.value = e.target.result
      }
      reader.readAsText(file)
    } else {
      // For PDF and Word files, show a message that content will be processed on the backend
      transcript.value = `[${file.name} uploaded - content will be processed when generating summary]`
    }
  }
}

const removeFile = () => {
  uploadedFile.value = null
  transcript.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const generateSummary = async () => {
  if (!canGenerate.value) return

  isGenerating.value = true
  clearMessage()

  try {
    let response
    if (activeTab.value === 'text') {
      response = await axios.post('https://ai-powered-meeting-notes-taker.onrender.com/api/summarize', {
        transcript: transcript.value,
        customPrompt: customPrompt.value
      })
    } else {
      const formData = new FormData()
      formData.append('file', uploadedFile.value)
      formData.append('customPrompt', customPrompt.value)
      
      response = await axios.post('https://ai-powered-meeting-notes-taker.onrender.com/api/summarize-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }

    if (response.data.success) {
      summary.value = response.data.summary
      editableSummary.value = response.data.summary
      showMessage('Summary generated successfully!', 'success')
    }
  } catch (error) {
    console.error('Error generating summary:', error)
    showMessage(
      error.response?.data?.error || 'Failed to generate summary. Please try again.',
      'error'
    )
  } finally {
    isGenerating.value = false
  }
}

const editSummary = () => {
  if (isEditing.value) {
    summary.value = editableSummary.value
    showMessage('Summary updated successfully!', 'success')
  }
  isEditing.value = !isEditing.value
}

const sendEmail = async () => {
  if (!canSendEmail.value) return

  isSending.value = true
  clearMessage()

  try {
    const emailList = recipients.value.split(',').map(email => email.trim()).filter(Boolean)
    
    const response = await axios.post('https://ai-powered-meeting-notes-taker.onrender.com/api/send-email', {
      recipients: emailList,
      subject: emailSubject.value,
      summary: summary.value,
      senderName: senderName.value
    })

    if (response.data.success) {
      showMessage(response.data.message, 'success')
    }
  } catch (error) {
    console.error('Error sending email:', error)
    showMessage(
      error.response?.data?.error || 'Failed to send email. Please try again.',
      'error'
    )
  } finally {
    isSending.value = false
  }
}

const resetApp = () => {
  transcript.value = ''
  customPrompt.value = ''
  summary.value = ''
  editableSummary.value = ''
  uploadedFile.value = null
  senderName.value = ''
  emailSubject.value = 'Meeting Summary'
  recipients.value = ''
  activeTab.value = 'text'
  isEditing.value = false
  clearMessage()
}

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    clearMessage()
  }, 5000)
}

const clearMessage = () => {
  message.value = ''
}

// Lifecycle
onMounted(() => {
  // Set default custom prompt
      customPrompt.value = 'Create a comprehensive summary with clear sections for: Key Decisions, Action Items (with owners and deadlines), Main Discussion Points, and Next Steps. Format with headings and bullet points for easy reading.'
})
</script>

<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <h1 class="title">
          <span class="ai-icon">🤖</span>
          AI Meeting Notes Summarizer
        </h1>
        <p class="subtitle">Transform your meeting transcripts into actionable insights</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <!-- Input Section -->
        <section class="input-section" v-if="!summary">
          <div class="card">
            <h2>Input Your Meeting Transcript</h2>
            
            <!-- Tab Navigation -->
            <div class="tabs">
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'text' }"
                @click="activeTab = 'text'"
              >
                📝 Text Input
              </button>
              <button 
                class="tab-btn" 
                :class="{ active: activeTab === 'file' }"
                @click="activeTab = 'file'"
              >
                📁 File Upload
              </button>
            </div>

            <!-- Text Input Tab -->
            <div v-if="activeTab === 'text'" class="tab-content">
              <div class="form-group">
                <label for="transcript">Meeting Transcript</label>
                <textarea
                  id="transcript"
                  v-model="transcript"
                  placeholder="Paste your meeting transcript here..."
                  rows="8"
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <!-- File Upload Tab -->
            <div v-if="activeTab === 'file'" class="tab-content">
              <div class="form-group">
                <label for="file-upload">Upload Text File</label>
                <div class="file-upload-area" @click="triggerFileUpload">
                  <input
                  ref="fileInput"
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  @change="handleFileUpload"
                  style="display: none"
                  />
                  <div class="upload-content">
                    <span class="upload-icon">📁</span>
                    <p>Click to upload or drag and drop</p>
                    <p class="upload-hint">Supports .txt, .md, .pdf, .doc, .docx files (max 10MB)</p>
                  </div>
                </div>
                <div v-if="uploadedFile" class="file-info">
                  <span class="file-name">📄 {{ uploadedFile.name }}</span>
                  <button @click="removeFile" class="remove-btn">Remove</button>
                </div>
              </div>
            </div>

            <!-- Custom Instructions -->
            <div class="form-group">
              <label for="custom-prompt">Custom Instructions</label>
              <textarea
                id="custom-prompt"
                v-model="customPrompt"
                placeholder="e.g., 'Create an executive summary in 3-4 paragraphs focusing on strategic decisions and business impact. Format with clear headings and bullet points for action items.'"
                rows="3"
                class="form-control"
              ></textarea>
              <div class="prompt-examples">
                <span class="example-tag" @click="setPrompt('Create an executive summary in 3-4 paragraphs focusing on strategic decisions, business impact, key action items, and next steps. Format with clear headings and bullet points for action items.')">
                  🎯 Executive Summary
                </span>
                <span class="example-tag" @click="setPrompt('Extract and organize all action items with owners, deadlines, dependencies, and priority levels (High/Medium/Low). Format as a structured action item list with clear ownership.')">
                  ✅ Action Items
                </span>
                <span class="example-tag" @click="setPrompt('Provide a technical summary covering technical decisions, implementation approaches, challenges, architecture considerations, and deployment plans. Use appropriate technical terminology.')">
                  🔧 Technical Summary
                </span>
                <span class="example-tag" @click="setPrompt('Create a project status summary including current progress, milestones, risks, resource needs, and next phase planning. Use status indicators for clarity.')">
                  📊 Project Status
                </span>
                <span class="example-tag" @click="setPrompt('Summarize for stakeholders focusing on business justification, customer impact, timeline, resource requirements, and risk factors. Use business-friendly language.')">
                  💼 Stakeholder Report
                </span>
              </div>
              <div class="prompt-help">
                <small>
                  💡 <strong>Pro Tip:</strong> Be specific about format, audience, and focus areas for better results. 
                  <a href="#" @click.prevent="showPromptGuide" class="help-link">View Prompt Guide</a>
                </small>
              </div>
            </div>

            <!-- Generate Button -->
            <button 
              @click="generateSummary" 
              :disabled="!canGenerate || isGenerating"
              class="btn btn-primary btn-large"
            >
              <span v-if="isGenerating" class="loading-spinner"></span>
              {{ isGenerating ? 'Generating Summary...' : 'Generate Summary' }}
            </button>
          </div>
        </section>

        <!-- Summary Section -->
        <section v-if="summary" class="summary-section">
          <div class="card">
            <div class="summary-header">
              <h2>Generated Summary</h2>
              <div class="summary-actions">
                <button @click="editSummary" class="btn btn-secondary">
                  {{ isEditing ? 'Save Changes' : 'Edit Summary' }}
                </button>
                <button @click="resetApp" class="btn btn-outline">Start Over</button>
              </div>
            </div>

            <!-- Editable Summary -->
            <div class="summary-content">
              <div v-if="!isEditing" class="summary-display" v-html="formattedSummary"></div>
              <textarea
                v-else
                v-model="editableSummary"
                rows="15"
                class="form-control summary-editor"
              ></textarea>
            </div>

            <!-- Email Sharing -->
            <div class="email-section">
              <h3>Share via Email</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="sender-name">Your Name</label>
                  <input
                    id="sender-name"
                    v-model="senderName"
                    type="text"
                    placeholder="Your Name"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label for="email-subject">Subject</label>
                  <input
                    id="email-subject"
                    v-model="emailSubject"
                    type="text"
                    placeholder="Meeting Summary"
                    class="form-control"
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="recipients">Recipient Emails</label>
                <textarea
                  id="recipients"
                  v-model="recipients"
                  placeholder="Enter email addresses separated by commas"
                  rows="3"
                  class="form-control"
                ></textarea>
                <small class="form-hint">Separate multiple emails with commas</small>
              </div>
              <button 
                @click="sendEmail" 
                :disabled="!canSendEmail || isSending"
                class="btn btn-success btn-large"
              >
                <span v-if="isSending" class="loading-spinner"></span>
                {{ isSending ? 'Sending...' : 'Send Summary' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      <span class="message-text">{{ message }}</span>
      <button @click="clearMessage" class="message-close">×</button>
    </div>
  </div>
</template>

<style scoped>
/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8fafc;
}

#app {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.ai-icon {
  font-size: 3rem;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
}

/* Main Content */
.main {
  padding: 3rem 0;
}

/* Cards */
.card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.card h2 {
  color: #2d3748;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 600;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 1rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  color: #64748b;
}

.tab-btn:hover {
  background-color: #f1f5f9;
  color: #475569;
}

.tab-btn.active {
  background-color: #3b82f6;
  color: white;
}

/* Form Controls */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* File Upload */
.file-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.upload-content {
  color: #64748b;
}

.upload-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #94a3b8;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f1f5f9;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.remove-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.remove-btn:hover {
  background: #dc2626;
}

/* Prompt Examples */
.prompt-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.example-tag {
  background-color: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #c7d2fe;
}

.example-tag:hover {
  background-color: #c7d2fe;
  transform: translateY(-1px);
}

.prompt-help {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.help-link {
  color: #d97706;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.help-link:hover {
  text-decoration: underline;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #10b981;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #059669;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.btn-outline {
  background-color: transparent;
  color: #6b7280;
  border: 2px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Summary Section */
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-actions {
  display: flex;
  gap: 0.75rem;
}

.summary-content {
  margin-bottom: 2rem;
}

.summary-display {
  background-color: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  line-height: 1.7;
}

.summary-editor {
  min-height: 300px;
}

/* Email Section */
.email-section {
  border-top: 2px solid #e2e8f0;
  padding-top: 2rem;
}

.email-section h3 {
  color: #2d3748;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  font-weight: 600;
}

/* Messages */
.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background-color: #10b981;
}

.message.error {
  background-color: #ef4444;
}

.message-text {
  flex: 1;
}

.message-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .header {
    padding: 2rem 0;
  }
  
  .title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .card {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .summary-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-actions {
    justify-content: stretch;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    text-align: center;
  }
}
</style>
