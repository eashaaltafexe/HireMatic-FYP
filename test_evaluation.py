from pymongo import MongoClient
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import json
import re

MONGO_URI = "mongodb+srv://hirematice_admin:DXVAd5aXWLuTeCR9@cluster0.6hifgaj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
MODEL_NAME = "google/flan-t5-small"

# Get sample data
client = MongoClient(MONGO_URI)
db = client['test']
app = db.applications.find_one(
    {'interviewSession.answers.0': {'$exists': True}},
    sort=[('lastUpdate', -1)]
)

if not app or "interviewSession" not in app:
    print("No data found")
    exit(1)

# Get first answer
first_answer = app["interviewSession"]["answers"][0]
question = first_answer["questionText"]
answer = first_answer["answer"]

print("="*80)
print("QUESTION:", question)
print("="*80)
print("ANSWER:", answer)
print("="*80)
print("ANSWER LENGTH:", len(answer), "characters")
print("="*80)

# Load model
print("\nLoading model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
model.to(device)
model.eval()

# Test evaluation
EVAL_INSTRUCTIONS = (
    "You are an objective HR technical evaluator. "
    "Given a question and a candidate's answer, produce a compact JSON object with these keys:\n"
    "relevance (0-10), depth (0-10), clarity (0-10), completeness (0-10), "
    "strengths (list), weaknesses (list), keywords (list), "
    "final_score (0-100), brief (one sentence). Return ONLY the JSON."
)

prompt = EVAL_INSTRUCTIONS + "\n\n"
prompt += f"Question: {question}\n\nCandidate answer: {answer}\n"
prompt += "\nReturn JSON now."

print("\n" + "="*80)
print("PROMPT (first 500 chars):")
print(prompt[:500])
print("="*80)

inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(device)
print("\nInput token count:", inputs['input_ids'].shape[1])

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=256,
        do_sample=False,
        temperature=0.0
    )

raw = tokenizer.decode(outputs[0], skip_special_tokens=True)
print("\n" + "="*80)
print("RAW MODEL OUTPUT:")
print(raw)
print("="*80)

# Try to parse JSON
json_text = None
if "{" in raw:
    first = raw.find("{")
    last = raw.rfind("}")
    if last > first:
        json_text = raw[first:last+1]

if json_text:
    print("\nEXTRACTED JSON TEXT:")
    print(json_text)
    try:
        parsed = json.loads(json_text.replace("'", '"'))
        print("\nPARSED SUCCESSFULLY:")
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print("\nJSON PARSE ERROR:", e)
else:
    print("\nNO JSON FOUND IN OUTPUT")
