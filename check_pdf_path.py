import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment
load_dotenv('.env.local')

# Connect to MongoDB
uri = os.getenv('MONGODB_URI')
client = MongoClient(uri)
db = client['test']

# Find the interview session with PDF
session = db.interviewSessions.find_one(
    {'candidate.name': 'CYNTHIA DWAYNE'},
    {'pdfPath': 1, 'overallScore': 1, 'candidate.name': 1}
)

if session:
    print(f"Found session for: {session.get('candidate', {}).get('name')}")
    print(f"PDF Path in DB: '{session.get('pdfPath')}'")
    print(f"Overall Score: {session.get('overallScore')}")
    
    # Check if file exists at that path
    pdf_path = session.get('pdfPath')
    if pdf_path:
        # Check as stored
        full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), pdf_path)
        print(f"\nFull path constructed: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")
        
        # Check in public directly
        public_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', os.path.basename(pdf_path))
        print(f"\nDirect public path: {public_path}")
        print(f"File exists: {os.path.exists(public_path)}")
else:
    print("No session found for CYNTHIA DWAYNE")
