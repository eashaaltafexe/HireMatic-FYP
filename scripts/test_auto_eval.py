"""Test version of auto_evaluate script - ignores 'evaluated' flag for testing"""
import sys
import os

# Add parent directory to path to import the main script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import everything from auto_evaluate_and_report
from auto_evaluate_and_report import *

if __name__ == "__main__":
    print("="*80)
    print("AUTO EVALUATION AND REPORT GENERATION (TEST MODE)")
    print("="*80)
    print(f"PDF Output Directory: {OUTPUT_PDF_DIR}")
    print(f"MongoDB URI: {MONGO_URI[:50]}...")
    print("="*80)
    
    try:
        client = MongoClient(MONGO_URI)
        db = client['test']
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {str(e)}")
        exit(1)
    
    # Find ANY application with answers (ignoring evaluated flag for testing)
    app = db.applications.find_one({
        'interviewSession.answers.0': { '$exists': True }
    }, sort=[('lastUpdate', -1)])
    
    if not app or "interviewSession" not in app or "answers" not in app["interviewSession"]:
        print("No interview answers found in database.")
        exit(1)
    
    print(f"✓ Found application: {app['_id']}")
    print(f"  Answers count: {len(app['interviewSession']['answers'])}")
    print(f"  Already evaluated: {app.get('interviewSession', {}).get('evaluated', False)}")
    
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
        # Get relative path for database
        rel_pdf_path = os.path.relpath(pdf_path, PROJECT_ROOT).replace("\\", "/")
        
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
            print("\n✓ MongoDB updated successfully")
            print(f"  - Evaluation flag: True")
            print(f"  - PDF path: {rel_pdf_path}")
            print(f"  - Overall score: {summary['overall_score']}")
        else:
            print("\n⚠ MongoDB update did not modify document (already had same values)")
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
