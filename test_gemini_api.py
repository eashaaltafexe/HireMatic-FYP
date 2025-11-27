import requests
import json

API_KEY = "AIzaSyA7D4_BORnr-vC0s092YS_0r1LlZNllriQ"

# Test different endpoints
endpoints = [
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}",
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}",
    f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={API_KEY}",
]

payload = {
    "contents": [{
        "parts": [{"text": "Say hello"}]
    }]
}

for i, url in enumerate(endpoints, 1):
    print(f"\n{'='*80}")
    print(f"Test {i}: {url.split('?')[0].split('/')[-2]}:{url.split('?')[0].split('/')[-1]}")
    print(f"{'='*80}")
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            print(f"SUCCESS! Response: {text}")
            print(f"\nWorking endpoint found: {url.split('?')[0]}")
            break
        else:
            print(f"Error: {response.text[:200]}")
    except Exception as e:
        print(f"Exception: {str(e)[:200]}")

print(f"\n{'='*80}")
print("API Key Test Complete")
print(f"{'='*80}")
