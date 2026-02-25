# HireMatic - AI-Powered Interview & Recruitment Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.x-yellow)](https://www.python.org/)

HireMatic is an intelligent recruitment platform that revolutionizes the hiring process through AI-powered virtual interviews, automated resume screening, and comprehensive candidate evaluation. Built as a Final Year Project (FYP), it combines cutting-edge technologies to streamline recruitment workflows for HR professionals while providing an intuitive experience for candidates.

## 🚀 Features

### For HR Managers
- **AI-Powered Virtual Interviewing** - Conduct automated interviews with Gemini AI
- **Smart Resume Parsing** - Extract and analyze candidate information automatically
- **Dynamic Question Generation** - Generate role-specific technical and HR questions using GPT-2
- **Video Recording & Storage** - Record interviews with Agora and store on MEGA cloud
- **Real-time Transcription** - Live speech-to-text during interviews
- **Automated Evaluation** - AI-generated reports and candidate scoring
- **Dashboard Analytics** - Track applications, interviews, and evaluations

### For Candidates
- **Easy Application Process** - Upload resume and apply with one click
- **Virtual Interview Experience** - AI-powered conversational interviews
- **Real-time Feedback** - Instant evaluation and progress tracking
- **Interview Recordings** - Access to your interview recordings

### For Admins
- **User Management** - Control access for HR managers and candidates
- **System Configuration** - Configure AI models and platform settings
- **Analytics Dashboard** - Overview of platform usage and metrics

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.3.2** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form management
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Server runtime
- **Next.js API Routes** - RESTful API endpoints
- **Python** - AI/ML processing
- **WebSocket** - Real-time transcription

### Database & Storage
- **MongoDB** - Primary database with Mongoose ODM
- **MEGA Cloud** - Video recording storage

### AI & ML
- **Google Gemini AI** - Interview conversation & evaluation
- **GPT-2** - Technical question generation
- **Transformers.js** - Client-side ML

### Video & Communication
- **Agora.io** - Real-time video/audio
- **Agora Cloud Recording** - Interview recording

### Authentication & Security
- **JWT (Jose)** - Secure authentication
- **bcryptjs** - Password hashing
- **NextAuth.js** - Authentication framework

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Git**

You'll also need accounts and API keys for:
- MongoDB Atlas (or local MongoDB)
- Google Gemini AI API
- Agora.io (for video interviews)
- MEGA Cloud Storage
- SMTP Server (Gmail recommended for emails)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/eashaaltafexe/HireMatic-FYP.git
cd HireMatic-FYP
```

### 2. Install Dependencies

**Node.js dependencies:**
```bash
npm install
```

**Python dependencies:**
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hirematic?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Gemini AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_INTERVIEWER_API_KEY=your_gemini_api_key_here

# Agora.io Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret

# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# MEGA Cloud Storage
MEGA_EMAIL=your_mega_email@example.com
MEGA_PASSWORD=your_mega_password
```

### 4. Setup Python Environment (Optional)

For evaluation scripts:
```bash
# Windows
setup_evaluation.bat

# Linux/Mac
chmod +x setup_evaluation.sh
./setup_evaluation.sh
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

The application will start at:
- **HTTP:** http://localhost:3000
- **WebSocket:** ws://localhost:3000/ws/transcribe

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
HireMatic-FYP/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── hr/                  # HR manager pages
│   │   ├── candidate/           # Candidate pages
│   │   ├── interview/           # Interview pages
│   │   └── api/                 # API routes
│   │       ├── applications/    # Application management
│   │       ├── interviews/      # Interview APIs
│   │       ├── questions/       # Question generation
│   │       └── evaluations/     # Evaluation APIs
│   ├── components/              # React components
│   ├── layers/                  # Layered architecture
│   │   ├── 1-data-access/      # Models and DB
│   │   ├── 2-business-logic/   # Business rules
│   │   └── 3-application/      # Services
│   └── virtual-interviewer/    # Interview system
├── public/                      # Static assets
├── chatbot/                     # Chatbot service
├── gpt2_clean/                  # GPT-2 model files
├── scripts/                     # Utility scripts
├── server.js                    # Custom server
└── package.json                 # Dependencies

```

## 🎯 Usage Guide

### For HR Managers

1. **Create Account** - Sign up as an HR manager
2. **Post Jobs** - Create job listings with requirements
3. **Generate Questions** - Auto-generate interview questions for roles
4. **Review Applications** - View and shortlist candidates
5. **Schedule Interviews** - Set up AI-powered virtual interviews
6. **Review Evaluations** - Access AI-generated candidate reports
7. **View Recordings** - Watch interview recordings stored on MEGA

### For Candidates

1. **Register** - Create a candidate account
2. **Upload Resume** - Submit your CV (PDF/DOCX supported)
3. **Apply for Jobs** - Browse and apply to positions
4. **Take Interviews** - Participate in AI virtual interviews
5. **View Results** - Check your evaluation and feedback

## 🔑 Key Features Explained

### Virtual AI Interviewer
- Powered by Google Gemini AI
- Natural conversation flow
- Contextual follow-up questions
- Real-time speech recognition
- Video and audio recording

### Resume Parser
- Extracts personal information
- Identifies skills and experience
- Parses education and certifications
- Supports PDF and DOCX formats

### Automated Evaluation
- AI-generated interview reports
- Scoring based on responses
- Technical skill assessment
- Communication analysis
- Downloadable PDF reports

### Question Generation
- Uses fine-tuned GPT-2 model
- Role-specific questions
- Technical and behavioral questions
- Customizable difficulty levels

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Environment variable protection
- API route protection
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network connectivity

**Gemini API Errors:**
- Verify API key is valid
- Check API quota limits
- Ensure proper API permissions

**Video Recording Issues:**
- Verify Agora credentials
- Check Agora.io dashboard for errors
- Ensure MEGA storage is configured

**Port Already in Use:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill
```

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

This is a Final Year Project. If you'd like to contribute or have suggestions, please feel free to open an issue or submit a pull request.

## 📄 License

This project is developed as a Final Year Project (FYP). All rights reserved.

## 👤 Author

**Easha Altaf**
- GitHub: [@eashaaltafexe](https://github.com/eashaaltafexe)
- Repository: [HireMatic-FYP](https://github.com/eashaaltafexe/HireMatic-FYP)

## 🙏 Acknowledgments

- Gemini AI for conversational intelligence
- Agora.io for video infrastructure
- Next.js team for the amazing framework
- MongoDB for database solutions
- All open-source contributors

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section
2. Review existing issues on GitHub
3. Create a new issue with detailed information

---

**Built with ❤️ for revolutionizing recruitment through AI**
