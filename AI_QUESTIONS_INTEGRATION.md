# AI-Generated Interview Questions Integration

## Overview
This integration uses a GPT-2 model to generate technical interview questions for shortlisted candidates in the HireMatic system.

## Components

### 1. Python FastAPI Service (app_simple.py)
- **Port**: 8000
- **Endpoints**:
  - `GET /` - Health check
  - `POST /generate` - Generate a single question
  - `POST /generate-multiple` - Generate 10-15 questions for a role

### 2. Next.js API Route
- **Path**: `/api/questions/generate`
- **Methods**: GET, POST
- **Purpose**: Bridge between frontend and Python service

### 3. Admin Dashboard Integration
- **Location**: `src/app/admin/dashboard/page.tsx`
- **Features**:
  - Role selection dropdown
  - Generate questions button
  - Display generated questions with numbering
  - Question type and difficulty tags

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install uvicorn fastapi pydantic
```

### 2. Start Python Service
```bash
cd "d:\HireMatic\HireMatic Implementation"
python -m uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000
```

### 3. Configure Environment Variable (Optional)
Add to your `.env.local`:
```
PYTHON_SERVICE_URL=http://localhost:8000
```

### 4. Start Next.js Development Server
```bash
npm run dev
```

## Usage

1. Navigate to Admin Dashboard: `/admin/dashboard`
2. Scroll down to "AI-Generated Interview Questions" section
3. Select a role from the dropdown:
   - Software Engineer
   - Data Scientist
   - Frontend Developer
   - Backend Developer
   - DevOps Engineer
   - Machine Learning Engineer
   - Full Stack Developer
   - Product Manager
4. Click "Generate Questions" button
5. View 10-15 AI-generated questions specific to the role

## Features

- **Role-Specific Questions**: Questions are tailored to each job role
- **Diversity**: Uses randomization to provide varied questions
- **Fallback Support**: If Python service is down, system continues working
- **Real-time Generation**: Questions generated on-demand
- **Clean UI**: Questions displayed with numbering, type, and difficulty tags

## API Response Format

```json
{
  "success": true,
  "data": {
    "role": "software engineer",
    "questions": [
      {
        "id": 1,
        "text": "What is your experience with data structures and algorithms?",
        "type": "technical",
        "difficulty": "medium"
      }
    ],
    "count": 10
  }
}
```

## Integration with GPT-2 Model

The system is designed to work with the GPT-2 model in `gpt2_clean/gpt2_technical_improved/`. 

### Full Model Integration (app.py)
For production use with the actual GPT-2 model:
```bash
# Requires torch to be properly installed
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Note**: If you encounter PyTorch DLL errors on Windows, use `app_simple.py` which provides role-based questions without requiring the ML model to be loaded.

## Troubleshooting

### Python Service Not Running
- Check if port 8000 is available
- Ensure Python dependencies are installed
- Verify you're in the correct directory

### Questions Not Generating
- Verify Python service is running: `http://localhost:8000`
- Check browser console for errors
- Ensure Next.js server is running

### PyTorch DLL Errors
- Use `app_simple.py` instead of `app.py`
- Or reinstall PyTorch with CPU-only version:
  ```bash
  pip uninstall torch
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  ```

## Future Enhancements

1. **Persist Questions**: Save generated questions to database
2. **Question History**: Track which questions were used for which candidates
3. **Custom Training**: Fine-tune model on company-specific interview data
4. **Difficulty Levels**: Allow selection of question difficulty
5. **Question Categories**: Filter by technical, behavioral, situational
6. **Export Feature**: Export questions to PDF or Word document
