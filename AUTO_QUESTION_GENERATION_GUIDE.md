# Automatic Question Generation Integration - Complete Guide

## 🎯 What Was Implemented

The system now **automatically generates 10 interview questions** when a candidate is shortlisted after resume parsing and AI screening. Questions are:
- Generated based on the job title/field
- Stored in the database against the candidate's application
- Linked to resume data and job description
- Accessible through admin panel

---

## 🔄 How It Works

### Automatic Flow:

```
1. Candidate applies for job
   ↓
2. Resume is parsed (Gemini AI)
   ↓
3. AI screening evaluates candidate
   ↓
4. If shortlisted (score ≥ 70%)
   ↓
5. ✨ QUESTIONS AUTO-GENERATED ✨
   - Extracts job field from title
   - Calls Python service
   - Generates 10 role-specific questions
   - Stores in database with application
   ↓
6. Interview scheduled
   ↓
7. HR/Admin can view questions
```

---

## 📁 Files Modified/Created

### 1. Database Model
**File:** `src/layers/1-data-access/models/Application.ts`
- Added `generatedQuestions` field to store questions
- Schema includes: id, text, type, difficulty, jobField, generatedAt

### 2. Auto Question Generator Service
**File:** `src/layers/2-business-logic/ai-services/autoQuestionGenerator.ts`
- `generateQuestionsForShortlistedCandidate()` - Generates questions
- `storeGeneratedQuestions()` - Saves to database
- Extracts job field from title (e.g., "Senior Software Engineer" → "software engineer")
- Includes fallback questions if service is down

### 3. Application API (Auto-trigger)
**File:** `src/app/api/applications/route.ts`
- Integrated question generation in shortlisting flow
- Automatically triggered when `isShortlisted = true`
- Generates and stores questions before scheduling interview

### 4. Questions Viewing API
**File:** `src/app/api/applications/[id]/questions/route.ts`
- GET endpoint to retrieve questions for an application
- Returns questions with candidate and job details
- Access control (candidate, HR, admin only)

### 5. Admin Panel - Questions Page
**File:** `src/app/admin/generated-questions/page.tsx`
- View all applications with generated questions
- Filter by shortlisted candidates
- Display questions with details
- Copy/Print functionality

### 6. Python Service (Already exists)
**File:** `app_simple.py`
- Provides `/generate-multiple` endpoint
- Generates 10-15 questions based on role
- Role-specific question banks

---

## 🚀 How to Use

### For System Setup:

**1. Start Python Service:**
```bash
cd "d:\HireMatic\HireMatic Implementation"
python -m uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000
```

**2. Start Next.js Server:**
```bash
npm run dev
```

### For Testing:

**Option 1: Automatic (When candidate applies)**
1. Go to job listing page
2. Apply for a job with a resume
3. Wait for AI screening (automatic)
4. If candidate is shortlisted (score ≥ 70%), questions are AUTO-GENERATED
5. Check admin panel to view questions

**Option 2: View Existing Questions**
1. Login as Admin
2. Navigate to: `/admin/generated-questions`
3. See all applications with generated questions
4. Click on an application to view questions

---

## 📊 Database Structure

### Application Document (MongoDB):

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),  // Candidate
  jobId: ObjectId("..."),   // Job applied for
  status: "Interview Scheduled",
  
  // Parsed Resume Data
  parsedResume: {
    personalInfo: { name, email, phone, ... },
    skills: { technical: [...], soft: [...] },
    experience: [...],
    education: [...]
  },
  
  // AI Screening Results
  evaluation: {
    score: 85,  // If ≥ 70, auto-generate questions
    feedback: "Strong match for role...",
    evaluatedBy: null,  // AI
    evaluationDate: Date
  },
  
  // ✨ AUTO-GENERATED QUESTIONS ✨
  generatedQuestions: [
    {
      id: 1,
      text: "What is your experience with data structures?",
      type: "technical",
      difficulty: "medium",
      jobField: "software engineer",
      generatedAt: Date
    },
    // ... 9 more questions
  ],
  
  timeline: [
    { status: "Application Submitted", ... },
    { status: "AI Screening Passed", ... },
    { status: "Questions Generated", description: "10 AI-generated questions created" },
    { status: "Interview Scheduled", ... }
  ]
}
```

---

## 🔍 How to View Generated Questions

### Admin Dashboard Method:
1. Login as Admin
2. Go to `/admin/generated-questions`
3. See list of shortlisted applications
4. Click on any application
5. View 10 generated questions with:
   - Question text
   - Type badge (technical, behavioral, etc.)
   - Difficulty badge (easy, medium, hard)
   - Job field tag
6. Copy questions or print them

### API Method:
```bash
GET /api/applications/{applicationId}/questions
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "applicationId": "...",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "jobTitle": "Software Engineer",
    "department": "Engineering",
    "questions": [ ... ],
    "count": 10,
    "resumeData": { ... }
  }
}
```

---

## 🎯 Supported Job Fields

Questions are automatically tailored for:
1. **Software Engineer** - Data structures, algorithms, system design
2. **Data Scientist** - ML algorithms, statistics, data analysis
3. **Frontend Developer** - React, CSS, responsive design
4. **Backend Developer** - APIs, databases, authentication
5. **DevOps Engineer** - CI/CD, Kubernetes, infrastructure
6. **Machine Learning Engineer** - Neural networks, MLOps
7. **Full Stack Developer** - End-to-end development
8. **Product Manager** - Roadmaps, stakeholder management

---

## 🔧 Configuration

### Environment Variables:
Add to `.env.local`:
```env
PYTHON_SERVICE_URL=http://localhost:8000
```

### Question Count:
Default: 10 questions per candidate
Change in: `src/layers/2-business-logic/ai-services/autoQuestionGenerator.ts`
```typescript
num_questions: 10  // Change this value
```

---

## ✅ Verification Steps

### 1. Check Python Service:
```bash
curl http://localhost:8000
# Should return: {"message": "Technical Interview Question Generator API", "status": "running"}
```

### 2. Test Question Generation:
```bash
curl -X POST http://localhost:8000/generate-multiple \
  -H "Content-Type: application/json" \
  -d '{"role":"software engineer","num_questions":10}'
```

### 3. Check Database:
After a candidate is shortlisted, check MongoDB:
```javascript
db.applications.findOne(
  { "generatedQuestions": { $exists: true } },
  { generatedQuestions: 1, "userId.name": 1, "jobId.title": 1 }
)
```

### 4. View in Admin Panel:
- Navigate to `/admin/generated-questions`
- Should see applications with question counts

---

## 🐛 Troubleshooting

### No Questions Generated?
1. Check if Python service is running (port 8000)
2. Verify candidate was shortlisted (score ≥ 70%)
3. Check console logs for errors
4. Verify `PYTHON_SERVICE_URL` in environment

### Python Service Not Starting?
```bash
# Install dependencies
pip install uvicorn fastapi pydantic

# Start service
python -m uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000
```

### Questions Not Showing in Admin Panel?
1. Ensure you're logged in as Admin
2. Check that applications exist with `generatedQuestions` field
3. Try filtering to "Shortlisted Only"

---

## 📈 Benefits

✅ **Automatic** - No manual intervention needed
✅ **Role-Specific** - Questions tailored to job field
✅ **Stored** - Questions saved with application for future reference
✅ **Accessible** - Easy viewing through admin panel
✅ **Scalable** - Works for any number of candidates
✅ **Integrated** - Part of normal application flow

---

## 🔮 Future Enhancements

1. **Difficulty Levels** - Auto-adjust based on candidate experience
2. **Resume-Based** - Generate questions from candidate's specific skills
3. **Answer Tracking** - Store candidate responses
4. **Question Pool** - Build library of effective questions
5. **Analytics** - Track which questions identify best candidates
6. **Export** - Download questions as PDF/Word
7. **Custom Templates** - HR can create question templates

---

## 📝 Summary

The integration is **COMPLETE** and **WORKING**:

- ✅ Questions auto-generate when candidates are shortlisted
- ✅ Stored in database with application, resume, and job data
- ✅ Viewable in admin panel at `/admin/generated-questions`
- ✅ Accessible via API endpoint
- ✅ Python service running on port 8000
- ✅ 10 role-specific questions per candidate
- ✅ Integrated into normal application workflow

**The system is now fully automated!** When a candidate applies and gets shortlisted, interview questions are automatically generated and stored for HR/Admin review.