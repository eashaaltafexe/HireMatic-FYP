import requests
import json

API_KEY = "AIzaSyA7D4_BORnr-vC0s092YS_0r1LlZNllriQ"

# List available models
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

print("Fetching available models...")
try:
    response = requests.get(list_url, timeout=10)
    print(f"Status Code: {response.status_code}\n")
    
    if response.status_code == 200:
        result = response.json()
        models = result.get('models', [])
        
        print(f"Found {len(models)} models:")
        print("="*80)
        
        for model in models:
            name = model.get('name', 'Unknown')
            display_name = model.get('displayName', 'Unknown')
            supported_methods = model.get('supportedGenerationMethods', [])
            
            print(f"\nModel: {name}")
            print(f"Display Name: {display_name}")
            print(f"Supported Methods: {', '.join(supported_methods)}")
            
            if 'generateContent' in supported_methods:
                print(f"✓ COMPATIBLE - Can use for evaluation")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {str(e)}")
