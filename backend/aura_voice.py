from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import speech_recognition as sr
from pydub import AudioSegment

router = APIRouter()

# Create uploads folder if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/voice")
async def receive_audio(audio: UploadFile = File(...)):
    """Receive audio from AURA frontend and convert to text"""
    
    # Save the audio file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{UPLOAD_DIR}/aura_recording_{timestamp}.wav"
    converted_filename = f"{UPLOAD_DIR}/aura_converted_{timestamp}.wav"
    
    try:
        # Save the uploaded file
        content = await audio.read()
        with open(filename, "wb") as buffer:
            buffer.write(content)
        
        # Convert to proper WAV format using pydub
        try:
            audio_segment = AudioSegment.from_file(filename)
            audio_segment.export(converted_filename, format="wav")
            print(f"✅ Audio converted to WAV format")
        except Exception as e:
            print(f"Conversion error: {e}")
            # If conversion fails, use original file
            converted_filename = filename
        
        # Speech recognition
        text = "Could not transcribe"
        try:
            recognizer = sr.Recognizer()
            with sr.AudioFile(converted_filename) as source:
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio_data = recognizer.record(source)
                
                try:
                    text = recognizer.recognize_google(audio_data)
                    print(f"🗣️ AURA heard: {text}")
                except sr.UnknownValueError:
                    text = "Could not understand audio"
                    print("❌ Could not understand audio")
                except sr.RequestError as e:
                    text = "Speech recognition service error"
                    print(f"❌ Speech recognition error: {e}")
        except Exception as e:
            print(f"Speech recognition error: {e}")
            text = "Speech recognition not available"
        
        # Clean up converted file if it exists and is different
        if converted_filename != filename and os.path.exists(converted_filename):
            os.remove(converted_filename)
        
        return JSONResponse({
            "status": "success",
            "message": f"Audio received and saved",
            "filename": filename,
            "size": os.path.getsize(filename),
            "transcript": text
        })
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse({
            "status": "error",
            "message": str(e)
        }, status_code=500)