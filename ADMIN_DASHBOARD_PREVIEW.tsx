import React from 'react';

/**
 * ADMIN DASHBOARD - AI QUESTIONS PREVIEW
 * 
 * This is a preview of how the AI-Generated Interview Questions section
 * looks on the Admin Dashboard at /admin/dashboard
 */

const AdminQuestionsPreview = () => {
  // Sample generated questions
  const sampleQuestions = [
    {
      id: 1,
      text: "What is your experience with data structures and algorithms?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 2,
      text: "How do you approach system design for scalable applications?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 3,
      text: "Explain the SOLID principles and how you apply them.",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 4,
      text: "What is your experience with microservices architecture?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 5,
      text: "How do you handle database optimization and indexing?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 6,
      text: "Describe your approach to writing unit tests.",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 7,
      text: "What is your experience with CI/CD pipelines?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 8,
      text: "How do you ensure code security in your applications?",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 9,
      text: "Explain the concept of dependency injection.",
      type: "technical",
      difficulty: "medium"
    },
    {
      id: 10,
      text: "What design patterns do you commonly use?",
      type: "technical",
      difficulty: "medium"
    }
  ];

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-blue-600">
          AI-Generated Interview Questions
        </h3>
        <div className="flex gap-3 items-center">
          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="software engineer">Software Engineer</option>
            <option value="data scientist">Data Scientist</option>
            <option value="frontend developer">Frontend Developer</option>
            <option value="backend developer">Backend Developer</option>
            <option value="devops engineer">DevOps Engineer</option>
            <option value="machine learning engineer">ML Engineer</option>
            <option value="full stack developer">Full Stack Developer</option>
            <option value="product manager">Product Manager</option>
          </select>
          <button className="px-6 py-2 bg-[#4285F4] text-white rounded-md hover:bg-blue-600 transition">
            Generate Questions
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sampleQuestions.map((question, index) => (
          <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{question.text}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {question.type || 'Technical'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {question.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuestionsPreview;

/**
 * VISUAL LAYOUT DESCRIPTION:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  AI-Generated Interview Questions              [Dropdown] [Btn] │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                  │
 * │  ┌──────────────────────────────────────────────────────────┐  │
 * │  │ ① What is your experience with data structures and       │  │
 * │  │    algorithms?                                            │  │
 * │  │    [Technical] [Medium]                                   │  │
 * │  └──────────────────────────────────────────────────────────┘  │
 * │                                                                  │
 * │  ┌──────────────────────────────────────────────────────────┐  │
 * │  │ ② How do you approach system design for scalable         │  │
 * │  │    applications?                                          │  │
 * │  │    [Technical] [Medium]                                   │  │
 * │  └──────────────────────────────────────────────────────────┘  │
 * │                                                                  │
 * │  ... (8-13 more questions) ...                                  │
 * │                                                                  │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * FEATURES:
 * - Blue header with title
 * - Role selector dropdown (8 options)
 * - Blue "Generate Questions" button
 * - Numbered circles for each question (1-15)
 * - Question text in dark gray
 * - Type badge (blue background)
 * - Difficulty badge (green background)
 * - Hover effect on questions (border changes to blue)
 * - Scrollable container for long lists
 * - Clean, modern design matching HireMatic theme
 */
