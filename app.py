from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re

# ======================================================
# CONFIGURATION
# ======================================================

MODEL_PATH = "./gpt2_clean/gpt2_technical_improved"  # Updated to your trained model folder
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ======================================================
# LOAD MODEL
# ======================================================

print("🔄 Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
# Add pad token if it doesn't exist (common for GPT-2)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH).to(DEVICE)
model.eval()
print("✅ Model loaded successfully!")

# ======================================================
# FASTAPI APP
# ======================================================

app = FastAPI(title="Technical Interview Question Generator")

class RoleInput(BaseModel):
    role: str
    num_questions: int = 10  # Default to 10 questions

@app.post("/generate")
def generate_question(data: RoleInput):
    try:
        prompt = f"[ROLE] {data.role.lower().strip()} [Q]"
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=60,
                min_new_tokens=15,
                temperature=0.9,
                top_p=0.92,
                top_k=50,
                do_sample=True,
                repetition_penalty=1.8,
                no_repeat_ngram_size=4,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )

        # Decode and clean
        full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        question = full_text.split('[Q]')[-1].split('[END]')[0].strip()
        question = re.sub(r'\s+', ' ', question)

        return {"role": data.role, "generated_question": question}
    except Exception as e:
        return {"error": str(e), "role": data.role, "generated_question": None}

@app.post("/generate-multiple")
def generate_multiple_questions(data: RoleInput):
    """Generate multiple interview questions for a given role"""
    try:
        num_questions = min(max(data.num_questions, 10), 15)  # Clamp between 10-15
        questions = []
        
        for i in range(num_questions):
            prompt = f"[ROLE] {data.role.lower().strip()} [Q]"
            inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=60,
                    min_new_tokens=15,
                    temperature=0.85 + (i * 0.02),  # Slightly vary temperature for diversity
                    top_p=0.92,
                    top_k=50,
                    do_sample=True,
                    repetition_penalty=1.8,
                    no_repeat_ngram_size=4,
                    pad_token_id=tokenizer.pad_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )

            # Decode and clean
            full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            question = full_text.split('[Q]')[-1].split('[END]')[0].strip()
            question = re.sub(r'\s+', ' ', question)
            
            if question and question not in questions:  # Avoid duplicates
                questions.append({
                    "id": i + 1,
                    "text": question,
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
