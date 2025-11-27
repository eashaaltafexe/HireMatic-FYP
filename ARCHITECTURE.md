# HireMatic - 4-Layer Architecture

This project follows a clean 4-layer architecture pattern for better separation of concerns, maintainability, and scalability.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Layer 4: Client Presentation Layer         │
│  (Next.js Frontend - User Interfaces)       │
│  - Admin Dashboard UI                       │
│  - Candidate Portal UI                      │
│  - HR Dashboard UI                          │
│  - Interview Bot UI                         │
│  - Report Generation UI                     │
└─────────────────────────────────────────────┘
                    ↕ HTTP/REST
┌─────────────────────────────────────────────┐
│  Layer 3: Application Layer                 │
│  (Node.js/Express - Backend Services)       │
│  - API Routing                              │
│  - User Management                          │
│  - Authentication & Authorization           │
│  - Progress Tracking                        │
│  - Interview Scheduling                     │
└─────────────────────────────────────────────┘
                    ↕ Function Calls
┌─────────────────────────────────────────────┐
│  Layer 2: Business Logic Layer              │
│  (AI/Python Models - Intelligence)          │
│  - Resume Parsing (NLP/NER)                 │
│  - Interviewer Bot                          │
│  - Job Description Generator                │
│  - Report Generation                        │
│  - Q&A Generation                           │
└─────────────────────────────────────────────┘
                    ↕ Data Access
┌─────────────────────────────────────────────┐
│  Layer 1: Data Access Layer                 │
│  (MongoDB - Data Storage)                   │
│  - User Profiles Collection                 │
│  - Resume Files Collection                  │
│  - Feedback Reports Collection              │
│  - Recorded Interviews Collection           │
│  - Job Postings Collection                  │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── layers/
│   ├── 1-data-access/           # Layer 1: Database & Models
│   │   ├── database/            # MongoDB connection
│   │   └── models/              # Mongoose schemas
│   │
│   ├── 2-business-logic/        # Layer 2: AI & Core Logic
│   │   └── ai-services/         # AI modules (Resume parsing, Interview bot, etc.)
│   │
│   ├── 3-application/           # Layer 3: Backend Services
│   │   ├── api/                 # API route handlers (moved from app/api)
│   │   ├── services/            # Business services (auth, scheduling, etc.)
│   │   └── middleware/          # Middleware functions
│   │
│   └── 4-presentation/          # Layer 4: Frontend UI
│       ├── admin/               # Admin UI pages
│       ├── candidate/           # Candidate portal pages
│       ├── hr/                  # HR dashboard pages
│       └── components/          # Shared UI components
│
└── app/                         # Next.js app directory (routes)
    └── api/                     # API endpoints (delegate to layer 3)
```

## 🔄 Data Flow

1. **User Request** → Layer 4 (UI Component)
2. **HTTP Request** → Layer 3 (API Route)
3. **Business Logic** → Layer 2 (AI Service)
4. **Data Query** → Layer 1 (Database)
5. **Response** → Flows back up through layers

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`

3. Run development server:
   ```bash
   npm run dev
   ```

## 📝 Layer Responsibilities

### Layer 1: Data Access Layer
- Database connections (MongoDB)
- Data models and schemas
- CRUD operations
- Data validation

### Layer 2: Business Logic Layer
- AI/ML model integration
- Resume parsing and analysis
- Interview question generation
- Candidate evaluation
- Job description generation

### Layer 3: Application Layer
- API endpoints
- Request/response handling
- Authentication & authorization
- Session management
- Business orchestration

### Layer 4: Presentation Layer
- User interfaces
- Form handling
- Client-side validation
- Real-time updates
- User experience
