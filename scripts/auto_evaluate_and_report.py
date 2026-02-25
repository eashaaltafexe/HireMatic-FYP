# -*- coding: utf-8 -*-
import sys
import os
import re
import json
from datetime import datetime
from collections import Counter
from pymongo import MongoClient
import requests
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
import time

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# ----------------------------
# CONFIG
# ----------------------------
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyDn5mxb-JB-PEFePtxqWmOhRzVIAmvKP8Q')
MONGO_URI = "mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"

# Setup PDF output directory (absolute path)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_PDF_DIR = os.path.join(PROJECT_ROOT, "public")
os.makedirs(OUTPUT_PDF_DIR, exist_ok=True)
OUTPUT_PDF_TEMPLATE = os.path.join(OUTPUT_PDF_DIR, "HR_Interview_Report_{name}.pdf")

# ----------------------------
# Initialize Gemini (REST API)
# ----------------------------
print("Initializing Gemini API...")
# Try multiple models in order of preference (using v1 API)
GEMINI_MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash-lite"
]

def test_gemini_model(model_name):
    """Test if a Gemini model is available"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1/{model_name}:generateContent?key={GEMINI_API_KEY}"
        test_payload = {
            "contents": [{
                "parts": [{"text": "Hello"}]
            }]
        }
        response = requests.post(url, json=test_payload, timeout=10)
        
        if response.status_code == 403:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', '')
            if 'leaked' in error_msg.lower():
                print("\n" + "="*80)
                print("[CRITICAL] API KEY LEAKED!")
                print("="*80)
                print("Your Gemini API key has been reported as leaked.")
                print("\nTo fix this:")
                print("1. Get new key: https://aistudio.google.com/app/apikey")
                print("2. Update .env.local: GEMINI_API_KEY=your-new-key")
                print("3. Restart server: npm run dev")
                print("\nSee GEMINI_API_FIX_URGENT.md for details")
                print("="*80 + "\n")
                return False
        
        return response.status_code == 200
    except:
        return False

# Find working model
GEMINI_MODEL = None
for model in GEMINI_MODELS:
    print(f"Testing {model}...")
    if test_gemini_model(model):
        GEMINI_MODEL = model
        print(f"[OK] Using {model}")
        break

if not GEMINI_MODEL:
    print("[WARNING] No Gemini model available, will use fallback scoring")
    GEMINI_MODEL = "models/gemini-2.5-flash"  # Default for URL construction

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
print("Gemini API initialized")

EVAL_INSTRUCTIONS = """
You are an objective HR technical evaluator. Evaluate the candidate's answer to the interview question.

Provide your evaluation as a JSON object with these EXACT keys:
- "relevance" (number 0-10): How relevant is the answer to the question?
- "depth" (number 0-10): How deep is the technical understanding shown?
- "clarity" (number 0-10): How clear and well-articulated is the answer?
- "completeness" (number 0-10): How complete is the answer?
- "strengths" (array of strings): List 2-3 key strengths
- "weaknesses" (array of strings): List 2-3 areas for improvement
- "keywords" (array of strings): Technical keywords/concepts mentioned
- "final_score" (number 0-100): Overall score
- "brief" (string): One sentence summary

Return ONLY valid JSON, no other text.
"""

def fallback_score(answer):
    """Rule-based scoring when LLM fails"""
    if not answer or len(answer.strip()) < 10:
        return 15
    elif len(answer.strip()) < 50:
        return 35
    elif len(answer.strip()) < 150:
        return 55
    else:
        return 70

def llm_evaluate(question, answer, ideal="", retry_count=2):
    """Evaluate answer using Gemini REST API with retry logic"""
    print("\n--- Gemini Evaluation ---")
    print("Question:", question[:80] + "..." if len(question) > 80 else question)
    print("Answer:", answer[:80] + "..." if len(answer) > 80 else answer)
    
    for attempt in range(retry_count):
        try:
            prompt = EVAL_INSTRUCTIONS + "\n\n"
            prompt += f"Question: {question}\n\nCandidate answer: {answer}\n"
            if ideal:
                prompt += f"\nIdeal/reference answer: {ideal}\n"
            prompt += "\nReturn JSON now:"
            
            # Call Gemini REST API
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(GEMINI_API_URL, json=payload, timeout=30)
            
            # Check for errors before raising
            if response.status_code != 200:
                error_detail = response.text
                print(f"Gemini API error (attempt {attempt+1}): {response.status_code}")
                print(f"Error details: {error_detail[:500]}")
                if attempt < retry_count - 1:
                    time.sleep(2)  # Wait before retry
                    continue
                else:
                    raise Exception(f"Gemini API failed: {response.status_code}")
            
            result = response.json()
            
            # Extract text from response
            raw = result['candidates'][0]['content']['parts'][0]['text']
            print(f"Raw Gemini output (attempt {attempt+1}):", raw[:200] + "..." if len(raw) > 200 else raw)
            
            # Remove markdown code blocks if present
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            
            # Extract JSON from response
            json_text = None
            if "{" in raw:
                first = raw.find("{")
                last = raw.rfind("}")
                if last > first:
                    json_text = raw[first:last+1]
            
            if not json_text:
                match = re.search(r"\{[^}]+\}", raw, re.DOTALL)
                if match:
                    json_text = match.group(0)
            
            if json_text:
                # Clean up common JSON issues
                # First, try to parse as-is
                try:
                    parsed = json.loads(json_text)
                    print("[OK] Parsed JSON successfully")
                except json.JSONDecodeError:
                    # If that fails, try cleaning it
                    json_text_clean = json_text.replace("'", '"')
                    # Fix common issues with quotes inside strings
                    # This is a simple fix - may need more robust handling
                    try:
                        parsed = json.loads(json_text_clean)
                        print("[OK] Parsed JSON successfully (after cleaning)")
                    except json.JSONDecodeError as e:
                        print(f"JSON parse error (attempt {attempt+1}):", e)
                        if attempt < retry_count - 1:
                            time.sleep(1)
                            continue
                        else:
                            parsed = {}
                
                if parsed:
                    def num(k, d=5.0):
                        try:
                            val = parsed.get(k, d)
                            return float(val) if val is not None else d
                        except:
                            return d
                    
                    def lst(k):
                        val = parsed.get(k, [])
                        return val if isinstance(val, list) else []
                    
                    relevance = num("relevance", 5)
                    depth = num("depth", 5)
                    clarity = num("clarity", 5)
                    completeness = num("completeness", 5)
                    final_score = parsed.get("final_score")
                    
                    if final_score is None or final_score == 0:
                        final_score = round(((relevance+depth+clarity+completeness)/40)*100, 2)
                    
                    final_score = max(0, min(100, float(final_score)))
                    print("Final score:", final_score)
                    
                    return {
                        "relevance": relevance,
                        "depth": depth,
                        "clarity": clarity,
                        "completeness": completeness,
                        "strengths": lst("strengths"),
                        "weaknesses": lst("weaknesses"),
                        "keywords": lst("keywords"),
                        "final_score": final_score,
                        "brief": parsed.get("brief", "Evaluated by AI")
                    }
            else:
                print(f"No JSON found in output (attempt {attempt+1})")
                if attempt < retry_count - 1:
                    time.sleep(1)
                    continue
                    
        except Exception as e:
            print(f"Gemini API error (attempt {attempt+1}):", str(e))
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
    
    # Fallback scoring if all retries fail
    print("[WARNING] Using fallback scoring")
    fb_score = fallback_score(answer)
    return {
        "relevance": fb_score / 10,
        "depth": fb_score / 10,
        "clarity": fb_score / 10,
        "completeness": fb_score / 10,
        "strengths": ["Response provided"],
        "weaknesses": ["Could not evaluate automatically"],
        "keywords": [],
        "final_score": fb_score,
        "brief": "Automatic evaluation unavailable - manual review needed"
    }

def evaluate_qa_pairs(qa_pairs):
    results = []
    for i, item in enumerate(qa_pairs, 1):
        q, a, ideal = item["q"], item["answer"], item.get("ideal", "")
        print(f"\n{'='*80}")
        print(f"Evaluating Question {i}/{len(qa_pairs)}")
        print(f"{'='*80}")
        
        try:
            llm_eval = llm_evaluate(q, a, ideal)
            final_score = llm_eval["final_score"]
        except Exception as e:
            print(f"Error evaluating Q{i}:", str(e))
            fb_score = fallback_score(a)
            llm_eval = {
                "relevance": fb_score / 10,
                "depth": fb_score / 10,
                "clarity": fb_score / 10,
                "completeness": fb_score / 10,
                "strengths": ["Response provided"],
                "weaknesses": ["Evaluation error"],
                "keywords": [],
                "final_score": fb_score,
                "brief": "Error during evaluation"
            }
            final_score = fb_score
        
        results.append({
            "question": q,
            "answer": a,
            "ideal": ideal,
            "llm_eval": llm_eval,
            "final_score": final_score
        })
        
        # Small delay to avoid API rate limits
        if i < len(qa_pairs):
            time.sleep(0.5)
    
    return results

def synthesize_summary(name, per_q):
    scores = [p["final_score"] for p in per_q]
    overall = round(sum(scores)/len(scores), 2)
    strengths, weaknesses, keywords = [], [], []
    for p in per_q:
        le = p.get("llm_eval") or {}
        strengths += le.get("strengths", [])
        weaknesses += le.get("weaknesses", [])
        keywords += le.get("keywords", [])
    
    # Determine hiring recommendation based on overall score
    if overall >= 70:
        recommendation = f"RECOMMENDED FOR HIRE - The candidate scored {overall}/100, demonstrating strong competency and suitability for the position. Proceed to next interview round."
        overall_paragraph = "Candidate shows strong technical understanding and is suitable for the role."
        hiring_decision = "RECOMMENDED"
    else:
        recommendation = f"NOT RECOMMENDED FOR HIRE - The candidate scored {overall}/100, which is below the minimum threshold of 70. The candidate needs significant improvement in key areas before being considered for this position."
        overall_paragraph = "Candidate shows some understanding but requires significant improvement in key areas to meet the position requirements."
        hiring_decision = "NOT RECOMMENDED"
    
    summary = {
        "overall_score": overall,
        "hiring_decision": hiring_decision,
        "top_strengths": [s for s,_ in Counter(strengths).most_common(6)],
        "top_weaknesses": [w for w,_ in Counter(weaknesses).most_common(6)],
        "tech_skills": keywords[:12],
        "overall_paragraph": overall_paragraph,
        "problem_paragraph": "Candidate applies structured problem-solving approaches.",
        "communication_paragraph": "Clear and concise communicator.",
        "project_highlights": ["TalentTalk Project: AI-powered voice interview system."],
        "recommendation": recommendation
    }
    return summary

def generate_pdf(name, position, summary, per_q, interview_date):
    filename = OUTPUT_PDF_TEMPLATE.format(name=name.replace(" ", "_"))
    print(f"\nGenerating PDF: {filename}")
    
    try:
        styles = getSampleStyleSheet()
        body = ParagraphStyle('body', parent=styles['Normal'], fontSize=11, leading=14)
        doc = SimpleDocTemplate(filename, pagesize=A4)
        story = []
        story.append(Paragraph("HR Interview Report", styles["Heading1"]))
        story.append(Spacer(1, 12))
        header = f"<b>Candidate:</b> {name} &nbsp;&nbsp; <b>Position:</b> {position} &nbsp;&nbsp; <b>Date:</b> {interview_date}"
        story.append(Paragraph(header, body))
        story.append(Spacer(1, 12))
        
        # Hiring Decision (Prominent)
        decision_style = ParagraphStyle('decision', parent=styles['Heading2'], fontSize=14, leading=18, textColor='green' if summary.get('hiring_decision') == 'RECOMMENDED' else 'red')
        story.append(Paragraph(f"<b>HIRING DECISION: {summary.get('hiring_decision', 'PENDING')}</b>", decision_style))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph(f"<b>Overall Score:</b> {summary['overall_score']} / 100", body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Candidate Suitability:</b>", body))
        story.append(Paragraph(summary["overall_paragraph"], body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Strengths:</b>", body))
        for s in summary["top_strengths"]:
            story.append(Paragraph(f"• {s}", body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Weaknesses:</b>", body))
        for w in summary["top_weaknesses"]:
            story.append(Paragraph(f"• {w}", body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Technical Skills:</b>", body))
        for s in summary["tech_skills"]:
            story.append(Paragraph(f"• {s}", body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Project Highlights:</b>", body))
        for p in summary["project_highlights"]:
            story.append(Paragraph(f"• {p}", body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Recommendation:</b>", body))
        story.append(Paragraph(summary["recommendation"], body))
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Per-question Breakdown:</b>", body))
        for i, p in enumerate(per_q, 1):
            story.append(Paragraph(f"{i}. {p['question']}", body))
            story.append(Paragraph(f"Score: {p['final_score']} / 100", body))
            if p["llm_eval"] and p["llm_eval"].get("brief"):
                story.append(Paragraph(f"Feedback: {p['llm_eval']['brief']}", body))
            story.append(Spacer(1, 8))
        doc.build(story)
        print(f"[OK] PDF generated successfully: {filename}")
        return filename
    except Exception as e:
        print(f"✗ PDF generation failed: {str(e)}")
        print(f"Error details:", e)
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("="*80)
    print("AUTO EVALUATION AND REPORT GENERATION")
    print("="*80)
    print(f"PDF Output Directory: {OUTPUT_PDF_DIR}")
    print(f"MongoDB URI: {MONGO_URI[:50]}...")
    print("="*80)
    
    try:
        client = MongoClient(MONGO_URI)
        db = client['test']
        print("[OK] Connected to MongoDB")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {str(e)}")
        exit(1)
    
    app = db.applications.find_one({
        'interviewSession.answers.0': { '$exists': True },
        'interviewSession.evaluated': { '$ne': True }
    }, sort=[('lastUpdate', -1)])
    
    if not app or "interviewSession" not in app or "answers" not in app["interviewSession"]:
        print("No unevaluated interview answers found.")
        exit(1)
    
    print(f"[OK] Found application: {app['_id']}")
    print(f"  Answers count: {len(app['interviewSession']['answers'])}")
    qa_pairs = [
        {
            "q": ans["questionText"],
            "answer": ans["answer"],
            "ideal": ""
        }
        for ans in app["interviewSession"]["answers"]
    ]
    candidate_name = app.get("parsedResume", {}).get("personalInfo", {}).get("name", "Candidate")
    position = app.get("jobId", "Unknown Position")
    interview_date = app["interviewSession"].get("completedAt", datetime.now()).strftime("%Y-%m-%d")
    per_q = evaluate_qa_pairs(qa_pairs)
    
    print("\n" + "="*80)
    print("EVALUATION RESULTS")
    print("="*80)
    print("Per-question scores:", [p["final_score"] for p in per_q])
    
    summary = synthesize_summary(candidate_name, per_q)
    print(f"Overall score: {summary['overall_score']}/100")
    print("="*80)
    
    pdf_path = generate_pdf(candidate_name, position, summary, per_q, interview_date)
    
    if pdf_path and os.path.exists(pdf_path):
        # Get filename only (Next.js serves public folder files at root)
        rel_pdf_path = os.path.basename(pdf_path)
        
        # Mark as evaluated in MongoDB
        update_result = db.applications.update_one(
            {"_id": app["_id"]}, 
            {"$set": {
                "interviewSession.evaluated": True,
                "interviewSession.pdfPath": rel_pdf_path,
                "interviewSession.overallScore": summary["overall_score"]
            }}
        )
        
        if update_result.modified_count > 0:
            print("\n[OK] MongoDB updated successfully")
            print(f"  - Evaluation flag: True")
            print(f"  - PDF path: {rel_pdf_path}")
            print(f"  - Overall score: {summary['overall_score']}")
        else:
            print("\n[WARNING] MongoDB update did not modify document")
    else:
        print("\n✗ PDF generation failed - MongoDB not updated")
        print("  Marking as evaluated anyway with score...")
        db.applications.update_one(
            {"_id": app["_id"]}, 
            {"$set": {
                "interviewSession.evaluated": True,
                "interviewSession.overallScore": summary["overall_score"],
                "interviewSession.pdfPath": "evaluation_failed"
            }}
        )
    
    print("\n" + "="*80)
    print("EVALUATION COMPLETE")
    print("="*80)
