# 🗂️ HireMatic - Quick Reference Guide

## 📁 Where to Find Everything

### 🗄️ Database & Models (Layer 1)
```
src/layers/1-data-access/
├── database/
│   └── connection.ts          ← MongoDB connection
└── models/
    ├── User.ts               ← User accounts
    ├── Job.ts                ← Job postings
    ├── Application.ts        ← Applications
    └── Interview.ts          ← Interviews
```

### 🤖 AI Services (Layer 2)
```
src/layers/2-business-logic/ai-services/
├── resumeParser.ts           ← Parse resumes
├── aiScreening.ts            ← Screen candidates
├── interviewerBot.ts         ← Conduct interviews
├── jobDescriptionGenerator.ts ← Create job posts
├── reportGenerator.ts        ← Generate reports
└── questionGenerator.ts      ← Create questions
```

### ⚙️ Backend Services (Layer 3)
```
src/layers/3-application/
├── services/
│   ├── auth.ts               ← Authentication
│   ├── userManagement.ts     ← User CRUD
│   ├── interviewScheduling.ts ← Schedule interviews
│   ├── progressTracking.ts   ← Track progress
│   └── notificationService.ts ← Send emails
└── middleware/
    ├── auth.ts               ← Auth middleware
    └── role.ts               ← Role checking
```

### 🎨 Frontend Pages (Layer 4)
```
src/app/
├── admin/                    ← Admin dashboard
│   ├── dashboard/
│   ├── users/
│   ├── reports/
│   └── settings/
├── hr/                       ← HR dashboard
│   ├── dashboard/
│   ├── jobs/
│   └── decision-support/
├── candidate/                ← Candidate portal
│   ├── dashboard/
│   ├── jobs/
│   ├── applications/
│   └── interviews/
└── interview/[id]/           ← Interview UI
```

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login          ← Login
POST /api/auth/signup         ← Sign up
GET  /api/auth/me             ← Get user
POST /api/auth/logout         ← Logout
```

### Jobs
```
GET  /api/jobs                ← List jobs
POST /api/jobs                ← Create job
GET  /api/jobs/[id]           ← Get job
PUT  /api/jobs/[id]           ← Update job
DEL  /api/jobs/[id]           ← Delete job
```

### Applications
```
GET  /api/applications        ← List applications
POST /api/applications        ← Apply to job
GET  /api/applications/[id]   ← Get application
PUT  /api/applications/[id]   ← Update status
```

### Interviews
```
GET  /api/interviews          ← List interviews
POST /api/schedule-interview  ← Schedule
GET  /api/interviews/[id]     ← Get details
POST /api/interviews/[id]/complete ← Complete
```

## 💻 Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## 🔑 Environment Variables

Create `.env.local` file:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
GEMINI_API_KEY=your-key
NEXT_PUBLIC_AGORA_APP_ID=your-id
AGORA_APP_CERTIFICATE=your-cert
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## 📝 How to Import

### From Layer 1 (Database)
```typescript
import dbConnect from '@/lib/db';
import { User, Job } from '@/models';
// OR
import { dbConnect, User, Job } from '@/layers/1-data-access';
```

### From Layer 2 (AI Services)
```typescript
import { ResumeParser } from '@/services/resumeParser';
// OR
import { InterviewerBot } from '@/layers/2-business-logic';
```

### From Layer 3 (Backend Services)
```typescript
import { authMiddleware } from '@/layers/3-application';
import UserManagementService from '@/layers/3-application/services/userManagement';
```

## 🎯 Quick Start Guide

### 1. First Time Setup
```bash
cd "d:\HireMatic\hireMatic 30%"
npm install
# Create .env.local file with your credentials
npm run dev
```

### 2. Access the App
- Open: http://localhost:3000
- Admin: http://localhost:3000/admin
- HR: http://localhost:3000/hr
- Candidate: http://localhost:3000/candidate

### 3. Development Workflow
1. Make changes to code
2. Save file (hot reload enabled)
3. Check browser for updates
4. Check terminal for errors

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# OR in PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### MongoDB Connection Issues
- Check .env.local has correct MONGODB_URI
- Verify MongoDB Atlas IP whitelist
- Check network connection

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Build Errors
```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

## 📚 Documentation

- **README.md** - Full project documentation
- **ARCHITECTURE.md** - Architecture details
- **PROJECT_SUMMARY.md** - Implementation summary
- **This file** - Quick reference

## 🎊 You're All Set!

The project is running and ready for development. Happy coding! 🚀
