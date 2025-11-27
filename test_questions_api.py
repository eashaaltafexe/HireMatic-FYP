"""
Test script to verify question generation API
"""
import requests
import json

# Test the Python service directly
print("Testing Python FastAPI Service...")
print("=" * 50)

try:
    # Test health endpoint
    response = requests.get("http://localhost:8000")
    print(f"✓ Health Check: {response.json()}")
    
    # Test question generation
    payload = {
        "role": "software engineer",
        "num_questions": 10
    }
    
    response = requests.post(
        "http://localhost:8000/generate-multiple",
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Generated {data['count']} questions for {data['role']}")
        print("\nSample Questions:")
        for i, q in enumerate(data['questions'][:5], 1):
            print(f"{i}. {q['text']}")
        print(f"... and {len(data['questions']) - 5} more questions")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nMake sure the Python service is running:")
    print("python -m uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000")
