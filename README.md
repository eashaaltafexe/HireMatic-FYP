# 🚀 HireMatic - AI-Powered Recruitment Platform

An intelligent recruitment and interview management system built with Next.js, featuring AI-powered resume parsing, automated interviews, and comprehensive candidate evaluation.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)

## 🏗️ Architecture

This project follows a clean **4-Layer Architecture**:

```
┌─────────────────────────────────────────────┐
│  Layer 4: Client Presentation Layer         │
│  Next.js Frontend - User Interfaces         │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  Layer 3: Application Layer                 │
│  Node.js Backend Services & API             │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  Layer 2: Business Logic Layer              │
│  AI/ML Services & Core Intelligence         │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  Layer 1: Data Access Layer                 │
│  MongoDB Database & Data Models             │
└─────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## ✨ Features

### For Admin
- 👥 User management and role assignment
- 📊 System analytics and reporting
- ⚙️ System configuration and settings
- 📋 Interview management

### For HR/Recruiters
- 📝 Job posting creation and management
- 👤 Candidate profile review
- 📅 Interview scheduling
- 📈 Candidate evaluation and comparison
- 🤖 AI-powered resume screening
- 📄 Automated report generation

### For Candidates
- 📄 Resume upload and parsing
- 🔍 Job search and browsing
- 📬 Application tracking
- 🗓️ Interview scheduling
- 💬 AI interviewer bot
- 📊 Evaluation results

### AI Features
- 🧠 **Resume Parser** - Extract structured information from resumes
- 🤖 **Interviewer Bot** - Conduct automated virtual interviews
- 📝 **Job Description Generator** - Create detailed job descriptions
- 📊 **Report Generator** - Generate comprehensive evaluation reports
- ❓ **Question Generator** - Dynamic interview question generation
- 🎯 **AI Screening** - Intelligent candidate screening

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TailwindCSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Next.js API Routes** - Backend API
- **MongoDB** - Database
- **Mongoose** - ODM

### AI/ML
- **Hugging Face Transformers** - NLP models
- **PDF Parse** - Resume parsing
- **Mammoth** - Document processing

### Authentication & Communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Agora** - Video calling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd "d:\HireMatic\hireMatic 30%"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://your-connection-string

   # Authentication
   JWT_SECRET=your-jwt-secret-key

   # AI Services
   GEMINI_API_KEY=your-gemini-api-key

   # Agora (Video Calling)
   NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id
   AGORA_APP_CERTIFICATE=your-agora-certificate

   # Email (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
hireMatic/
├── src/
│   ├── layers/                    # 4-Layer Architecture
│   │   ├── 1-data-access/        # Database & Models
│   │   │   ├── database/         # DB connection
│   │   │   └── models/           # Mongoose schemas
│   │   ├── 2-business-logic/     # AI Services
│   │   │   └── ai-services/      # AI modules
│   │   ├── 3-application/        # Backend Services
│   │   │   ├── api/              # API handlers
│   │   │   ├── services/         # Business services
│   │   │   └── middleware/       # Middleware
│   │   └── 4-presentation/       # Frontend
│   │       ├── admin/            # Admin UI
│   │       ├── candidate/        # Candidate UI
│   │       ├── hr/               # HR UI
│   │       └── components/       # Shared components
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   ├── admin/                # Admin pages
│   │   ├── candidate/            # Candidate pages
│   │   ├── hr/                   # HR pages
│   │   └── (auth-routes)/        # Auth pages
│   ├── components/               # React components
│   ├── lib/                      # Utilities (backward compat)
│   ├── models/                   # Models (backward compat)
│   ├── services/                 # Services (backward compat)
│   └── middleware.ts             # Next.js middleware
├── public/                       # Static files
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config
├── server.js                     # Custom server
└── ARCHITECTURE.md               # Architecture docs
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `NEXT_PUBLIC_AGORA_APP_ID` | Agora video calling app ID | ✅ |
| `AGORA_APP_CERTIFICATE` | Agora app certificate | ✅ |
| `SMTP_HOST` | Email server host | ✅ |
| `SMTP_PORT` | Email server port | ✅ |
| `SMTP_USER` | Email username | ✅ |
| `SMTP_PASS` | Email password/app password | ✅ |

## 🎯 Running the Project

### Development Mode
```bash
npm run dev
```
Runs on http://localhost:3000 with hot reload enabled.

### Production Mode
```bash
# Build the project
npm run build

# Start production server
npm run start
```

### Linting
```bash
npm run lint
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Submit application
- `GET /api/applications/[id]` - Get application details
- `PUT /api/applications/[id]` - Update application status

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/schedule-interview` - Schedule interview
- `GET /api/interviews/[id]` - Get interview details
- `POST /api/interviews/[id]/complete` - Complete interview

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

## 🤝 Contributing

This is a proprietary project. For contribution guidelines, please contact the development team.

## 📄 License

This project is proprietary and confidential.

## 👥 Team

Developed by the HireMatic Team

## 📞 Support

For support and inquiries, please contact: [your-email@example.com]

---

Made with ❤️ by HireMatic Team
