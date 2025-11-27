from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random

# ======================================================
# FASTAPI APP - Simplified version using pre-generated questions
# ======================================================

app = FastAPI(title="Technical Interview Question Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoleInput(BaseModel):
    role: str
    num_questions: int = 10  # Default to 10 questions

# Load pre-generated questions from the model's output
try:
    with open('./gpt2_clean/gpt2_technical_improved/generated_questions.json', 'r') as f:
        QUESTIONS_BANK = json.load(f)
except Exception as e:
    print(f"Warning: Could not load generated_questions.json: {e}")
    QUESTIONS_BANK = {
        "questions": [
            "What is your experience with object-oriented programming?",
            "How do you handle version control in your projects?",
            "Explain the concept of asynchronous programming.",
            "What are design patterns and which ones have you used?",
            "How do you approach debugging complex issues?",
            "Describe your experience with REST APIs.",
            "What is your testing strategy for applications?",
            "How do you ensure code quality in your projects?",
            "Explain the difference between SQL and NoSQL databases.",
            "What is your approach to learning new technologies?"
        ]
    }

@app.get("/")
def read_root():
    return {"message": "Technical Interview Question Generator API", "status": "running"}

@app.post("/generate")
def generate_question(data: RoleInput):
    """Generate a single question"""
    try:
        questions = QUESTIONS_BANK.get("questions", [])
        if not questions:
            return {"error": "No questions available", "role": data.role, "generated_question": None}
        
        question = random.choice(questions)
        return {"role": data.role, "generated_question": question}
    except Exception as e:
        return {"error": str(e), "role": data.role, "generated_question": None}

@app.post("/generate-multiple")
def generate_multiple_questions(data: RoleInput):
    """Generate multiple interview questions for a given role"""
    try:
        num_questions = min(max(data.num_questions, 10), 15)  # Clamp between 10-15
        
        # Role-specific question templates
        role_questions = {
            "software engineer": [
                "What is your experience with data structures and algorithms?",
                "How do you approach system design for scalable applications?",
                "Explain the SOLID principles and how you apply them.",
                "What is your experience with microservices architecture?",
                "How do you handle database optimization and indexing?",
                "Describe your approach to writing unit tests.",
                "What is your experience with CI/CD pipelines?",
                "How do you ensure code security in your applications?",
                "Explain the concept of dependency injection.",
                "What design patterns do you commonly use?",
                "How do you handle error handling and logging?",
                "What is your experience with containerization using Docker?",
                "Explain the difference between synchronous and asynchronous operations.",
                "How do you optimize application performance?",
                "What is your approach to code reviews?"
            ],
            "data scientist": [
                "What machine learning algorithms are you most familiar with?",
                "How do you handle missing data in your datasets?",
                "Explain the bias-variance tradeoff.",
                "What is your experience with deep learning frameworks?",
                "How do you evaluate model performance?",
                "Describe your approach to feature engineering.",
                "What is your experience with big data technologies?",
                "How do you handle imbalanced datasets?",
                "Explain overfitting and how to prevent it.",
                "What is your experience with A/B testing?",
                "How do you deploy machine learning models to production?",
                "Describe your experience with time series analysis.",
                "What statistical methods do you commonly use?",
                "How do you communicate findings to non-technical stakeholders?",
                "What is your approach to data visualization?"
            ],
            "frontend developer": [
                "What is your experience with modern JavaScript frameworks?",
                "How do you ensure cross-browser compatibility?",
                "Explain the concept of virtual DOM.",
                "What is your approach to responsive web design?",
                "How do you optimize website performance?",
                "Describe your experience with state management.",
                "What is your approach to accessibility in web applications?",
                "How do you handle API integration in frontend applications?",
                "Explain the concept of progressive web apps.",
                "What CSS methodologies have you used?",
                "How do you approach component reusability?",
                "What is your testing strategy for frontend code?",
                "Describe your experience with build tools and bundlers.",
                "How do you handle browser caching?",
                "What is your approach to SEO optimization?"
            ],
            "backend developer": [
                "What is your experience with RESTful API design?",
                "How do you handle authentication and authorization?",
                "Explain database normalization and denormalization.",
                "What is your approach to API versioning?",
                "How do you handle concurrent requests?",
                "Describe your experience with message queues.",
                "What is your approach to caching strategies?",
                "How do you ensure API security?",
                "Explain the concept of database transactions.",
                "What is your experience with ORM frameworks?",
                "How do you handle rate limiting?",
                "Describe your approach to logging and monitoring.",
                "What is your experience with serverless architecture?",
                "How do you optimize database queries?",
                "What is your approach to API documentation?"
            ],
            "devops engineer": [
                "What is your experience with infrastructure as code?",
                "How do you approach CI/CD pipeline design?",
                "Explain the concept of container orchestration.",
                "What is your experience with Kubernetes?",
                "How do you handle secrets management?",
                "Describe your approach to monitoring and alerting.",
                "What is your experience with cloud platforms?",
                "How do you ensure high availability?",
                "Explain the concept of blue-green deployment.",
                "What is your approach to disaster recovery?",
                "How do you handle log aggregation?",
                "Describe your experience with configuration management.",
                "What is your approach to security scanning?",
                "How do you optimize infrastructure costs?",
                "What is your experience with automated testing?"
            ],
            "machine learning engineer": [
                "What is your experience with neural network architectures?",
                "How do you approach model optimization?",
                "Explain the concept of transfer learning.",
                "What is your experience with MLOps?",
                "How do you handle model versioning?",
                "Describe your approach to hyperparameter tuning.",
                "What is your experience with distributed training?",
                "How do you monitor model performance in production?",
                "Explain the concept of ensemble methods.",
                "What is your approach to data preprocessing?",
                "How do you handle model drift?",
                "Describe your experience with reinforcement learning.",
                "What frameworks do you use for model deployment?",
                "How do you ensure model reproducibility?",
                "What is your approach to model explainability?"
            ],
            "full stack developer": [
                "What is your experience with full stack development?",
                "How do you approach architecture design for web applications?",
                "Explain your preferred tech stack and why.",
                "What is your experience with database design?",
                "How do you handle state management across frontend and backend?",
                "Describe your approach to API design.",
                "What is your experience with authentication systems?",
                "How do you ensure application security?",
                "Explain your approach to testing across the stack.",
                "What is your experience with real-time applications?",
                "How do you optimize full stack application performance?",
                "Describe your approach to deployment strategies.",
                "What is your experience with cloud services?",
                "How do you handle error tracking and monitoring?",
                "What is your approach to scalability?"
            ],
            "product manager": [
                "How do you prioritize features for a product roadmap?",
                "What is your experience with user research?",
                "Explain your approach to stakeholder management.",
                "How do you measure product success?",
                "What is your experience with agile methodologies?",
                "Describe your approach to product launches.",
                "How do you handle competing priorities?",
                "What is your experience with data-driven decision making?",
                "How do you gather and validate customer feedback?",
                "Explain your approach to market analysis.",
                "What is your experience with A/B testing?",
                "How do you work with engineering teams?",
                "Describe your approach to product strategy.",
                "What metrics do you track for product performance?",
                "How do you handle feature requests from different stakeholders?"
            ]
        }
        
        # Get role-specific questions or use generic ones
        role_key = data.role.lower().strip()
        available_questions = role_questions.get(role_key, role_questions["software engineer"])
        
        # Select questions
        selected_questions = random.sample(available_questions, min(num_questions, len(available_questions)))
        
        questions = []
        for i, q_text in enumerate(selected_questions):
            questions.append({
                "id": i + 1,
                "text": q_text,
                "type": "technical",
                "difficulty": "medium"
            })
        
        return {
            "role": data.role,
            "questions": questions,
            "count": len(questions)
        }
    except Exception as e:
        return {"error": str(e), "role": data.role, "questions": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
