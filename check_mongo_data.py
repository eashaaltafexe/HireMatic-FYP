from pymongo import MongoClient
import json

MONGO_URI = "mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client['test']

# Find the most recent application with answers
app = db.applications.find_one(
    {'interviewSession.answers.0': {'$exists': True}},
    sort=[('lastUpdate', -1)]
)

if not app:
    print("No applications with answers found")
else:
    print("Application ID:", str(app['_id']))
    print("\nHas interviewSession:", 'interviewSession' in app)
    
    if 'interviewSession' in app:
        session = app['interviewSession']
        print("Has answers:", 'answers' in session)
        
        if 'answers' in session:
            answers = session['answers']
            print("Number of answers:", len(answers))
            
            if len(answers) > 0:
                print("\nFirst answer structure:")
                print("Keys:", list(answers[0].keys()))
                print("\nFirst answer content:")
                for key, value in answers[0].items():
                    if isinstance(value, str):
                        print(f"  {key}: {value[:100]}...")
                    else:
                        print(f"  {key}: {value}")
                
                print("\n\nAll answers summary:")
                for i, ans in enumerate(answers, 1):
                    print(f"\nAnswer {i}:")
                    for key in ans.keys():
                        val = ans[key]
                        if isinstance(val, str):
                            print(f"  {key}: {val[:80]}...")
                        else:
                            print(f"  {key}: {val}")
