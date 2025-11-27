import warnings
import os
import re
from datetime import datetime
from tempfile import NamedTemporaryFile, mkdtemp
import shutil

import numpy as np
import pygame
import sounddevice as sd
import soundfile as sf
from faster_whisper import WhisperModel
from gtts import gTTS
import google.generativeai as genai

# --------------------------
# SUPPRESS WARNINGS
# --------------------------

# Suppress ctranslate2 deprecation warning
warnings.filterwarnings("ignore", category=UserWarning, module="ctranslate2")

# Suppress pygame welcome message
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = "1"

# Suppress pkg_resources deprecation warning in pygame
warnings.filterwarnings(
    "ignore",
    message="pkg_resources is deprecated as an API",
    category=UserWarning,
    module="pygame.pkgdata"
)

# Suppress huggingface_hub symlinks warning
warnings.filterwarnings(
    "ignore",
    message=".*huggingface_hub.*symlinks.*",
    category=UserWarning
)

# Suppress all huggingface_hub warnings
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = "1"

# --------------------------
# TEMPORARY FILES MANAGEMENT
# --------------------------

# Create a temporary directory for this session
TEMP_DIR = mkdtemp(prefix="hirematic_")
print(f"📁 Temporary files directory: {TEMP_DIR}")

def cleanup_temp_files():
    """Clean up all temporary files and directory"""
    try:
        if os.path.exists(TEMP_DIR):
            shutil.rmtree(TEMP_DIR)
            print(f"🗑️  Cleaned up temporary directory: {TEMP_DIR}")
    except Exception as e:
        print(f"⚠️  Warning: Could not clean up temp directory: {e}")

def save_transcription(text, type="user"):
    """Save transcription to a temporary file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(TEMP_DIR, f"{type}_transcription_{timestamp}.txt")
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Type: {type}\n")
            f.write("-" * 50 + "\n")
            f.write(text)
        return filename
    except Exception as e:
        print(f"⚠️  Warning: Could not save transcription: {e}")
        return None

def save_conversation_log(conversation_history):
    """Save full conversation history to a file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(TEMP_DIR, f"conversation_log_{timestamp}.txt")
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("HIREMATIC AI ASSISTANT - CONVERSATION LOG\n")
            f.write("=" * 60 + "\n\n")
            
            for i, entry in enumerate(conversation_history, 1):
                f.write(f"Exchange {i}:\n")
                f.write(f"User: {entry['user']}\n")
                f.write(f"Assistant: {entry['assistant']}\n")
                f.write("-" * 60 + "\n\n")
        
        return filename
    except Exception as e:
        print(f"⚠️  Warning: Could not save conversation log: {e}")
        return None

# --------------------------
# UTILITY FUNCTIONS
# --------------------------

def clean_text_for_speech(text):
    """Remove unwanted characters for TTS"""
    text = re.sub(r'[^\w\s.,!?@-]', '', text)
    text = re.sub(r'[*#`]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# --------------------------
# INITIALIZE MODELS
# --------------------------

genai.configure(api_key="AIzaSyAwwvKCGfiNh9NVmq4g7z7NjvjEfGCP-ns")
model = genai.GenerativeModel('gemini-2.5-pro')

print("🔄 Loading Whisper model (this may take a moment)...")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
print("✅ Whisper model loaded!")

# --------------------------
# HIREMATIC SYSTEM PROMPT
# --------------------------
HIREMATIC_SYSTEM_PROMPT = """You are HireMatic AI Assistant, an intelligent recruitment support system designed to assist HR professionals, candidates, and administrators in navigating the AI-powered autonomous hiring platform.

## CORE IDENTITY & ROLE
- **Name**: HireMatic AI Assistant
- **Purpose**: Provide expert guidance EXCLUSIVELY on the HireMatic recruitment platform - its features, processes, and usage
- **Scope**: STRICTLY limited to HireMatic system queries. Do NOT answer general questions, provide general advice, or discuss topics outside HireMatic
- **Tone**: Professional, supportive, efficient, and encouraging. Always maintain a balance between being helpful and respecting data privacy
- **Language**: Use clear, concise English. Avoid jargon unless necessary, and explain technical terms when used

## RESPONSE LENGTH REQUIREMENTS
- Keep responses SHORT and CONCISE (2-4 sentences maximum)
- CRITICAL: Provide COMPLETE answers within 2-4 sentences - do NOT give partial or incomplete information
- Summarize the ENTIRE answer comprehensively within the sentence limit
- Every response must be self-contained and fully answer the user's question
- Only provide detailed explanations if explicitly asked for more details
- Use bullet points sparingly - prefer natural, brief sentences
- Get straight to the point without lengthy introductions
- If more details exist, end with: "Would you like me to elaborate on any specific part?"

## SYSTEM KNOWLEDGE BASE

### HireMatic Platform Modules:
1. **Admin Dashboard**: User management, role-based permissions, comprehensive reporting
2. **Job Generation**: AI-powered job description creation, posting, and management
3. **Candidate Portal**: Application tracking, interview scheduling, evaluation reports access
4. **Smart Resume Parsing**: Automated extraction, duplicate detection, scoring, and filtering
5. **Interview Scheduling**: Automated notifications, availability checking, link generation
6. **Virtual Interviewer**: Voice-based AI interviews with pre-designed questions, voice interaction, transcription and recording
7. **Evaluation & Fairness System**: Emotion analysis, bias detection, soft skills assessment, real-time fairness monitoring
8. **Automated Reporting**: Performance metrics, candidate comparison, ranking, and badge assignment

### Key Objectives:
- BO-1: Reduce manual recruitment time
- BO-2: Improve hiring accuracy with AI insights
- BO-3: Enhance candidate satisfaction with instant feedback
- BO-4: Boost recruiter productivity through automation
- BO-5: Minimize bias in screening for equitable hiring

## RESPONSE GUIDELINES

### For HR Professionals:
- Provide brief, actionable guidance on job creation, screening, and reports
- Offer quick tips on using automation features effectively

### For Candidates:
- Give clear, reassuring answers about applications and interviews
- Briefly explain what to expect in AI-based interviews
- Address fairness concerns concisely

### For Administrators:
- Provide quick guidance on user management and settings
- Offer brief troubleshooting help

## CONVERSATIONAL PROTOCOLS

### DO:
✓ Give short, direct answers (2-4 sentences for most questions)
✓ Ask clarifying questions if needed
✓ Reference relevant HireMatic modules briefly
✓ Offer to provide more details if the user wants them
✓ Maintain privacy - never request sensitive data

### DON'T:
✗ Make promises about hiring outcomes or guarantee job offers
✗ Access, request, or simulate access to actual user data or databases
✗ Provide legal advice on employment law
✗ Make discriminatory statements or reinforce biases
✗ Share or request API keys, passwords, or authentication details
✗ Override system fairness protocols or suggest ways to bypass bias detection
✗ Provide information about competitors or alternative hiring systems
✗ Answer ANY questions unrelated to HireMatic platform - always redirect to HireMatic topics
✗ Engage in casual conversation, jokes, or off-topic discussions
✗ Provide general knowledge, trivia, or educational content not related to HireMatic

## STRICT SCOPE RESTRICTIONS

### CRITICAL RULE: ONLY ANSWER HIREMATIC-RELATED QUERIES
You are EXCLUSIVELY a HireMatic system assistant. You must ONLY respond to questions about:
- HireMatic platform features and modules
- Recruitment processes within HireMatic
- Job applications through HireMatic
- Interview processes in HireMatic
- Resume submission and parsing in HireMatic
- HireMatic system navigation and usage
- Account/portal access in HireMatic

### FORBIDDEN TOPICS - ALWAYS REFUSE:
✗ General AI or technology questions unrelated to HireMatic
✗ General career advice not specific to HireMatic platform
✗ Resume writing tips not related to HireMatic's parsing system
✗ Interview tips not specific to HireMatic's virtual interviewer
✗ Other recruitment platforms or competitors
✗ General HR practices outside HireMatic context
✗ Personal life advice, entertainment, or casual conversation
✗ Technical support for non-HireMatic software
✗ Mathematical calculations, coding help, or academic questions
✗ News, weather, sports, or current events
✗ General knowledge questions (history, science, geography, etc.)

### RESPONSE TEMPLATE FOR OUT-OF-SCOPE QUERIES:
"I'm specifically designed to assist with the HireMatic recruitment platform only. I cannot help with [topic mentioned]. Is there anything about HireMatic I can assist you with?"

## CRITICAL INSTRUCTIONS
- ALWAYS provide COMPLETE, comprehensive answers within 2-4 sentences - never give partial responses
- Summarize the full information concisely rather than cutting it short
- Each response must fully satisfy the user's query within the sentence limit
- End with a brief follow-up question ONLY if clarification is needed
- Example GOOD response: "HireMatic's Virtual Interviewer conducts voice-based AI interviews using pre-designed questions, records and transcribes your responses in real-time, and evaluates your answers for soft skills and communication quality. The system ensures fairness through bias detection and provides instant feedback. Would you like to know how to prepare for it?"
- Example BAD response: "HireMatic's Virtual Interviewer uses AI to conduct interviews. It has some features."

## CURRENT SESSION CONTEXT
- Today's date: {current_date}
- Session mode: Voice-based interaction
- User role: [To be determined through conversation]

Remember: Your goal is to make recruitment easier, fairer, and more efficient for everyone using HireMatic. Be the helpful, knowledgeable guide that builds trust in AI-powered hiring."""

# --------------------------
# CORE FUNCTIONS
# --------------------------

def generate_response(text, conversation_history=[]):
    """Generate response using Gemini API with HireMatic context"""
    current_date = datetime.now().strftime("%B %d, %Y")
    
    system_prompt = HIREMATIC_SYSTEM_PROMPT.replace("{current_date}", current_date)
    
    full_prompt = f"{system_prompt}\n\n## CURRENT CONVERSATION\n"
    
    for entry in conversation_history[-3:]:
        full_prompt += f"\nUser: {entry['user']}\nAssistant: {entry['assistant']}\n"
    
    full_prompt += f"\nUser: {text}\nAssistant:"
    
    response = model.generate_content(full_prompt)
    return response.text

def record_audio(duration=15, sample_rate=44100):
    """Record audio with better quality and duration"""
    print(f"🎤 Recording... Speak now!")
    
    audio_data = sd.rec(int(duration * sample_rate), 
                        samplerate=sample_rate, 
                        channels=1, 
                        dtype=np.float32)
    sd.wait()
    print("✓ Recording finished!")
    
    # Normalize audio to improve quality
    if np.max(np.abs(audio_data)) > 0:
        audio_data = audio_data / np.max(np.abs(audio_data))
    
    temp_audio = NamedTemporaryFile(suffix=".wav", delete=False, dir=TEMP_DIR)
    sf.write(temp_audio.name, audio_data, sample_rate)
    return temp_audio.name

def speech_to_text(audio_path):
    """Convert speech to text with better accuracy settings"""
    print("🔄 Processing your voice...")
    
    segments, info = whisper_model.transcribe(
        audio_path,
        beam_size=5,
        language="en",
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    
    transcription = " ".join([segment.text for segment in segments])
    return clean_text_for_speech(transcription)

def text_to_speech(text):
    """Convert text to speech using gTTS"""
    cleaned_text = clean_text_for_speech(text)
    tts = gTTS(cleaned_text)
    output_audio = NamedTemporaryFile(suffix=".mp3", delete=False, dir=TEMP_DIR)
    tts.save(output_audio.name)
    return output_audio.name

def play_audio(audio_path):
    """Play audio file using pygame"""
    pygame.mixer.init()
    pygame.mixer.music.load(audio_path)
    pygame.mixer.music.play()
    
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)
    
    pygame.mixer.music.stop()
    pygame.mixer.quit()

def chatbot_pipeline(conversation_history=[]):
    """Streamlined pipeline with natural conversation flow"""
    try:
        # Record audio
        audio_path = record_audio(duration=15)
        text_input = speech_to_text(audio_path)
        os.unlink(audio_path)
        
        if not text_input or len(text_input.strip()) < 3:
            print("⚠️  I didn't catch that. Let me try again...\n")
            return None, conversation_history
        
        # Save user transcription
        user_transcript_file = save_transcription(text_input, type="user")
        
        # Show brief confirmation
        display_text = text_input if len(text_input) <= 60 else text_input[:57] + "..."
        print(f"✓ Heard: \"{display_text}\"")
        
        # Generate response
        print("🤖 Processing...\n")
        response_text = generate_response(text_input, conversation_history)
        
        # Save assistant response
        assistant_transcript_file = save_transcription(response_text, type="assistant")
        
        # Update conversation history
        conversation_history.append({
            "user": text_input,
            "assistant": response_text
        })
        
        # Save conversation log
        conv_log_file = save_conversation_log(conversation_history)
        
        # Convert to speech and play
        print("🔊 Speaking response...")
        response_audio_path = text_to_speech(response_text)
        play_audio(response_audio_path)
        os.unlink(response_audio_path)
        
        print("=" * 60 + "\n")
        
        return response_text, conversation_history
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, conversation_history

# --------------------------
# MAIN LOOP
# --------------------------

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🎯 HIREMATIC AI ASSISTANT")
    print("   Voice-Powered Recruitment Support")
    print("=" * 60)
    print("\n📋 I can help you with:")
    print("   • Job applications & candidate portal")
    print("   • Interview preparation & virtual interviewer")
    print("   • Resume submission & parsing")
    print("   • HR workflow automation")
    print("   • Platform features & navigation\n")
    print("🎙️  How it works:")
    print("   1. Press ENTER to start speaking")
    print("   2. Speak your question naturally")
    print("   3. I'll respond with voice and text")
    print("   4. Continue the conversation or type 'quit' to exit\n")
    print("=" * 60 + "\n")
    
    conversation_history = []
    
    # Welcome message
    welcome_msg = "Hello! I'm the HireMatic AI Assistant. I'm here to help you with our recruitment platform. Are you a candidate, HR professional, or administrator?"
    print(f"🤖 Assistant: {welcome_msg}\n")
    
    # Play welcome message
    try:
        welcome_audio = text_to_speech(welcome_msg)
        play_audio(welcome_audio)
        os.unlink(welcome_audio)
    except Exception as e:
        print(f"⚠️  Could not play welcome audio: {e}")
    
    print("=" * 60 + "\n")
    
    try:
        while True:
            # Simple prompt - just press ENTER
            user_action = input("🎤 Press ENTER to speak (or type 'quit' to exit): ").strip().lower()
            
            if user_action == 'quit':
                print("\n👋 Thank you for using HireMatic AI Assistant!")
                print("   Your conversation has been saved. Goodbye!\n")
                break
            
            # If user presses ENTER, start the conversation
            if user_action == '':
                response, conversation_history = chatbot_pipeline(conversation_history)
            else:
                print("💡 Tip: Just press ENTER without typing anything to start speaking\n")
    
    finally:
        # Clean up temporary files on exit
        cleanup_temp_files()