export const dummyApplications = [
  {
    _id: "app1",
    jobId: {
      _id: "job1",
      title: "Senior Software Engineer",
      company: "TechCorp Solutions",
    },
    status: "Interview Scheduled",
    appliedDate: "2024-03-10T10:00:00Z",
    lastUpdate: "2024-03-15T14:30:00Z",
    interview: {
      date: "2024-03-20T15:00:00Z",
      link: "https://meet.google.com/abc-defg-hij",
      type: "Technical Interview",
      notes: "Please prepare for system design and coding questions"
    },
    documents: [
      {
        name: "Resume.pdf",
        url: "/documents/resume.pdf",
        type: "resume"
      },
      {
        name: "Cover Letter.pdf",
        url: "/documents/cover-letter.pdf",
        type: "cover_letter"
      }
    ],
    timeline: [
      {
        date: "2024-03-15T14:30:00Z",
        status: "Interview Scheduled",
        description: "Technical interview scheduled for March 20th"
      },
      {
        date: "2024-03-12T09:00:00Z",
        status: "Under Review",
        description: "Application is being reviewed by the hiring team"
      },
      {
        date: "2024-03-10T10:00:00Z",
        status: "Application Submitted",
        description: "Your application has been received"
      }
    ],
    evaluation: {
      score: 85,
      feedback: "Strong technical background and excellent problem-solving skills",
      evaluationDate: "2024-03-13T16:00:00Z"
    },
    notifications: [
      {
        message: "Your technical interview has been scheduled",
        date: "2024-03-15T14:30:00Z",
        read: false
      },
      {
        message: "Your application is under review",
        date: "2024-03-12T09:00:00Z",
        read: true
      }
    ]
  },
  {
    _id: "app2",
    jobId: {
      _id: "job2",
      title: "Product Manager",
      company: "InnovateTech",
    },
    status: "Under Review",
    appliedDate: "2024-03-08T11:30:00Z",
    lastUpdate: "2024-03-14T13:15:00Z",
    documents: [
      {
        name: "Resume.pdf",
        url: "/documents/resume-pm.pdf",
        type: "resume"
      }
    ],
    timeline: [
      {
        date: "2024-03-14T13:15:00Z",
        status: "Under Review",
        description: "Application is being reviewed by the hiring manager"
      },
      {
        date: "2024-03-08T11:30:00Z",
        status: "Application Submitted",
        description: "Your application has been received"
      }
    ],
    notifications: [
      {
        message: "Your application is now under review",
        date: "2024-03-14T13:15:00Z",
        read: false
      }
    ]
  },
  {
    _id: "app3",
    jobId: {
      _id: "job3",
      title: "UX Designer",
      company: "DesignFlow Inc",
    },
    status: "Rejected",
    appliedDate: "2024-03-05T09:45:00Z",
    lastUpdate: "2024-03-13T17:00:00Z",
    documents: [
      {
        name: "Portfolio.pdf",
        url: "/documents/portfolio.pdf",
        type: "portfolio"
      },
      {
        name: "Resume.pdf",
        url: "/documents/resume-design.pdf",
        type: "resume"
      }
    ],
    timeline: [
      {
        date: "2024-03-13T17:00:00Z",
        status: "Rejected",
        description: "Thank you for your interest. We have decided to move forward with other candidates"
      },
      {
        date: "2024-03-07T14:00:00Z",
        status: "Under Review",
        description: "Application is being reviewed by the design team"
      },
      {
        date: "2024-03-05T09:45:00Z",
        status: "Application Submitted",
        description: "Your application has been received"
      }
    ],
    evaluation: {
      score: 70,
      feedback: "Good portfolio but looking for more experience in mobile design",
      evaluationDate: "2024-03-13T16:45:00Z"
    },
    notifications: [
      {
        message: "Status update on your application",
        date: "2024-03-13T17:00:00Z",
        read: false
      }
    ]
  }
]; 