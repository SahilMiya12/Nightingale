from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import requests
import json
import re
from datetime import datetime
import socket
import sqlite3
import traceback
import time

# Import SENTINEL functions
from agents.sentinel import run_sentinel, get_priority_badge, set_deepseek_url, sentinel_extract_info

# Import CLARITY functions
from agents.clarity import set_deepseek_url as set_clarity_url, process_patient_for_clarity

# Import NEXUS functions
from agents.nexus import process_patient_for_nexus

# Import ORBIT functions
from agents.orbit import process_patient_for_orbit

# Import MEDIX functions
from agents.medix import process_patient_for_medix

# Import CARELINK functions
from agents.carelink import process_patient_for_carelink

# Import AUDIT functions
from agents.audit import process_patient_for_audit

# Import SAFETY functions
from agents.safety import process_patient_for_safety

# Import DOCTOR functions
from agents.doctor import process_patient_for_doctor

# Import database functions
from database import (
    get_patient,
    save_conversation,
    get_conversation_history,
    save_collected_info,
    get_patient_info,
    list_all_patients,
    save_triage_result,
    get_triage_stats,
    save_clarity_summary,
    save_nexus_record,
    get_all_nexus_records,
    save_orbit_appointment,
    get_all_orbit_appointments,
    save_medix_suggestion,
    get_all_medix_suggestions,
    save_carelink_plan,
    get_all_carelink_plans,
    log_audit_event,
    get_audit_logs,
    get_audit_stats,
    save_safety_log,
    get_safety_logs,
    get_safety_stats,
    save_doctor_review,
    get_doctor_review,
    get_all_doctor_reviews,
    get_doctor_stats,
    DB_PATH,
    init_database
)

app = FastAPI(title="NIGHTINGALE API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8100"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_database()

# ---------- FRIEND'S LAPTOP IP ----------
FRIEND_IP = "172.17.27.191"
DEEPSEEK_URL = f"http://{FRIEND_IP}:11434/api/generate"
print(f"🔗 DeepSeek URL: {DEEPSEEK_URL}")

# Set DeepSeek URL for SENTINEL
set_deepseek_url(DEEPSEEK_URL)

# Set DeepSeek URL for CLARITY
set_clarity_url(DEEPSEEK_URL)

# Store active session state (in memory)
active_sessions = {}

# Emergency keywords (Safety Guardrail)
EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "severe bleeding",
    "difficulty breathing", "shortness of breath", "unconscious",
    "severe allergic reaction", "suicide", "kill myself",
    "overdose", "poison", "severe head injury"
]

# Medicine request keywords (Hard-coded guardrail)
MEDICINE_REQUEST_KEYWORDS = [
    "suggest medicine", "suggest me medicine", "what medicine",
    "which medicine", "recommend medicine", "can i take medicine",
    "what should i take", "tablet", "tablets",
    "medicine for fever", "medicine for headache",
    "medicine for cold", "medicine for pain", "give me medicine",
    "prescribe", "prescription"
]

# ---- TERMINATION PHRASES (Multi-language) ----
TERMINATION_PHRASES = {
    'en': [
        "that's all", "that is all", "no more", "nothing else", 
        "i have told you everything", "i have no other symptoms",
        "that's everything", "i'm done", "i am done",
        "no additional symptoms", "no other symptoms",
        "that's it", "that is it", "all done"
    ],
    'hi': ["बस इतना ही", "और कुछ नहीं", "कोई और लक्षण नहीं", "मैंने सब बता दिया", "बस यही है"],
    'ta': ["இதுதான்", "வேறு எதுவும் இல்லை", "வேறு அறிகுறிகள் இல்லை", "நான் சொன்னதெல்லாம் இதுதான்"],
    'ml': ["ഇത്ര മാത്രം", "വേറെ ഒന്നുമില്ല", "വേറെ ലക്ഷണങ്ങൾ ഇല്ല", "ഞാൻ പറഞ്ഞതെല്ലാം ഇതാണ്"],
    'te': ["ఇంతే", "వేరే ఏమీ లేదు", "వేరే లక్షణాలు లేవు", "నేను చెప్పింది ఇంతే"],
    'kn': ["ಇಷ್ಟೇ", "ಬೇರೆ ಏನೂ ಇಲ್ಲ", "ಬೇರೆ ಲಕ್ಷಣಗಳಿಲ್ಲ", "ನಾನು ಹೇಳಿದ್ದು ಇಷ್ಟೇ"]
}

ALL_TERMINATION_PHRASES = []
for phrases in TERMINATION_PHRASES.values():
    ALL_TERMINATION_PHRASES.extend(phrases)

class TextInput(BaseModel):
    text: str
    session_id: str = "default"


def strip_think(text: str) -> str:
    """Remove DeepSeek reasoning blocks."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def call_deepseek(prompt: str, max_tokens: int = 150, timeout: int = 30) -> str:
    """Call DeepSeek on friend's laptop."""
    payload = {
        "model": "deepseek-r1:1.5b",
        "prompt": prompt,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    try:
        print(f"📤 Sending to DeepSeek...")
        r = requests.post(DEEPSEEK_URL, json=payload, timeout=timeout)
        r.raise_for_status()
        raw = r.json().get("response", "")
        if raw:
            return strip_think(raw)
        return ""
    except Exception as e:
        print(f"❌ DeepSeek error: {e}")
        return ""


def detect_emergency(patient_message: str) -> bool:
    message_lower = patient_message.lower()
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in message_lower:
            return True
    return False


def is_medicine_request(patient_message: str) -> bool:
    """Check if patient is asking for medicine."""
    message_lower = patient_message.lower()
    for keyword in MEDICINE_REQUEST_KEYWORDS:
        if keyword in message_lower:
            print(f"💊 Medicine request detected: '{keyword}'")
            return True
    return False


def detect_termination(patient_message: str) -> bool:
    message_lower = patient_message.lower().strip()
    for phrase in ALL_TERMINATION_PHRASES:
        if phrase.lower() in message_lower:
            print(f"🔴 Termination detected: '{phrase}'")
            return True
    return False


def format_conversation(history: list) -> str:
    if not history:
        return ""
    
    conversation = []
    for item in history:
        role = item.get("role", "Unknown")
        message = item.get("message", "")
        conversation.append(f"{role}: {message}")
    
    return "\n".join(conversation)


def get_deepseek_response(conversation_history: list) -> str:
    """AURA - Pure Natural Conversation."""
    
    recent = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
    conversation_text = format_conversation(recent)
    
    system_prompt = f"""You are AURA, a medical intake assistant.

Ask ONE short question to understand the patient's condition.
Do not give medical advice.

Conversation:
{conversation_text}

Ask one question to understand better.
AURA:"""

    response = call_deepseek(system_prompt, max_tokens=80, timeout=30)
    
    if not response:
        return "Could you tell me more about your symptoms?"
    
    return response


@app.post("/aura/process")
async def process_text(input_data: TextInput):
    try:
        patient_id = input_data.session_id
        patient_message = input_data.text.strip()
        
        if not patient_message:
            return {
                "response": "Please tell me what you're experiencing.",
                "status": "success"
            }
        
        print(f"\n{'='*50}")
        print(f"👤 Patient: {patient_message}")
        print(f"🆔 Session: {patient_id}")
        print(f"{'='*50}\n")
        
        # ---------- SAFETY GUARDRAIL: EMERGENCY ----------
        if detect_emergency(patient_message):
            print("🚨 Emergency detected!")
            emergency_response = (
                "⚠️ Your symptoms may be serious. Please seek immediate medical attention. "
                "Call emergency services (911 in US, 112 in Europe, 108 in India)."
            )
            save_conversation(patient_id, "Patient", patient_message)
            save_conversation(patient_id, "AURA", emergency_response)
            
            # AUDIT: Log emergency
            log_audit_event(patient_id, "AURA", "emergency_detected", 
                           f"Emergency keywords detected: {patient_message}", "emergency")
            
            # SAFETY: Log emergency rule check
            save_safety_log(patient_id, "emergency_keywords", 
                           f"Emergency keywords detected: {patient_message}", 
                           False, "critical", "🚨 Emergency detected in patient message")
            
            return {
                "response": emergency_response,
                "is_complete": True,
                "emergency": True,
                "status": "emergency"
            }
        
        # ---------- SAVE PATIENT MESSAGE ----------
        get_patient(patient_id)
        save_conversation(patient_id, "Patient", patient_message)
        
        # AUDIT: Log patient message
        log_audit_event(patient_id, "AURA", "patient_message_received", 
                       f"Patient said: {patient_message[:100]}", "success")
        
        # ---------- HARD GUARDRAIL: MEDICINE REQUEST ----------
        if is_medicine_request(patient_message):
            print("💊 Medicine request intercepted - using safe response")
            medicine_response = (
                "I understand you're feeling unwell. "
                "I cannot recommend or prescribe medicine. "
                "I'll help collect information about your symptoms so a healthcare professional "
                "can review them. Could you tell me more about your symptoms?"
            )
            save_conversation(patient_id, "AURA", medicine_response)
            
            # AUDIT: Log medicine request
            log_audit_event(patient_id, "AURA", "medicine_request_detected", 
                           f"Medicine request: {patient_message}", "warning")
            
            # SAFETY: Log medicine request rule check
            save_safety_log(patient_id, "medicine_request", 
                           f"Patient requested medicine: {patient_message}", 
                           False, "warning", "💊 Patient asked for medication without prescription")
            
            return {
                "response": medicine_response,
                "is_complete": False,
                "patient_id": patient_id,
                "status": "success"
            }
        
        # ---------- CHECK TERMINATION ----------
        if detect_termination(patient_message):
            print("🔴 Patient wants to end conversation")
            db_history = get_conversation_history(patient_id)
            
            extracted_info = sentinel_extract_info(db_history)
            
            if extracted_info and any(v for v in extracted_info.values() if v and v != "null"):
                save_collected_info(patient_id, extracted_info)
            
            triage_result = None
            if extracted_info:
                triage_result = run_sentinel(extracted_info)
                if patient_id not in active_sessions:
                    active_sessions[patient_id] = {}
                active_sessions[patient_id]["triage"] = triage_result
                
                # Save triage to database
                if triage_result:
                    save_triage_result(patient_id, triage_result, extracted_info)
                    print(f"✅ Triage saved for patient: {patient_id}")
                    
                    # AUDIT: Log triage
                    log_audit_event(patient_id, "SENTINEL", "triage_completed", 
                                   f"Triage level: {triage_result.get('level', 4)}, Priority: {triage_result.get('priority', 'UNKNOWN')}", 
                                   "success")
                    
                    # ============================================
                    # RUN SAFETY CHECK ON PATIENT DATA
                    # ============================================
                    print("\n" + "=" * 60)
                    print("🛡️ STARTING SAFETY PIPELINE")
                    print("=" * 60)
                    
                    try:
                        safety_result = process_patient_for_safety(patient_id, extracted_info, triage_result)
                        if safety_result:
                            # Log each safety check to database
                            for check in safety_result.get("checks", []):
                                save_safety_log(
                                    patient_id,
                                    check.get("rule", "unknown"),
                                    check.get("details", ""),
                                    check.get("passed", True),
                                    check.get("severity", "info"),
                                    f"Rule: {check.get('rule')} - {check.get('details')}"
                                )
                            
                            # Log summary
                            if safety_result.get("emergency_alert"):
                                save_safety_log(
                                    patient_id,
                                    "safety_summary",
                                    "Emergency alert triggered",
                                    False,
                                    "critical",
                                    "🚨 Emergency safety alert - immediate attention required"
                                )
                            else:
                                save_safety_log(
                                    patient_id,
                                    "safety_summary",
                                    f"Safety checks completed: {len(safety_result.get('checks', []))} checks",
                                    True,
                                    "info",
                                    f"✅ All safety checks passed"
                                )
                            
                            print(f"✅ SAFETY: {len(safety_result.get('checks', []))} checks logged")
                    except Exception as e:
                        print(f"❌ SAFETY processing error: {e}")
                        log_audit_event(patient_id, "SAFETY", "safety_error", 
                                       f"Error: {str(e)}", "error")
                        import traceback
                        traceback.print_exc()
                    
                    # ============================================
                    # GENERATE CLARITY SUMMARY
                    # ============================================
                    print("\n" + "=" * 60)
                    print("🧠 STARTING CLARITY PIPELINE")
                    print("=" * 60)
                    
                    if extracted_info and extracted_info.get("symptom"):
                        print(f"✅ CLARITY: Valid symptom found: {extracted_info.get('symptom')}")
                        print(f"📊 CLARITY: extracted_info = {extracted_info}")
                        try:
                            clarity_summary = process_patient_for_clarity(patient_id, extracted_info, triage_result)
                            if clarity_summary:
                                print(f"✅ CLARITY: Summary received, saving...")
                                save_clarity_summary(patient_id, clarity_summary)
                                print(f"✅ CLARITY summary saved for patient: {patient_id}")
                                
                                # AUDIT: Log clarity
                                log_audit_event(patient_id, "CLARITY", "summary_generated", 
                                               f"Clinical summary generated for symptom: {extracted_info.get('symptom')}", 
                                               "success")
                                
                                # ============================================
                                # GENERATE NEXUS UNIFIED RECORD
                                # ============================================
                                print("\n" + "=" * 60)
                                print("📋 STARTING NEXUS PIPELINE")
                                print("=" * 60)
                                
                                try:
                                    nexus_record = process_patient_for_nexus(patient_id, extracted_info, triage_result, clarity_summary)
                                    if nexus_record:
                                        save_nexus_record(patient_id, nexus_record)
                                        print(f"✅ NEXUS record saved for patient: {patient_id}")
                                        
                                        # AUDIT: Log nexus
                                        log_audit_event(patient_id, "NEXUS", "record_created", 
                                                       f"Unified record created", "success")
                                        
                                        # ============================================
                                        # GENERATE ORBIT APPOINTMENT
                                        # ============================================
                                        print("\n" + "=" * 60)
                                        print("📅 STARTING ORBIT PIPELINE")
                                        print("=" * 60)
                                        
                                        orbit_appointment = None
                                        try:
                                            orbit_appointment = process_patient_for_orbit(patient_id, nexus_record)
                                            if orbit_appointment:
                                                save_orbit_appointment(patient_id, orbit_appointment)
                                                print(f"✅ ORBIT appointment booked for patient: {patient_id}")
                                                
                                                # AUDIT: Log orbit
                                                log_audit_event(patient_id, "ORBIT", "appointment_booked", 
                                                               f"Appointment: {orbit_appointment.get('appointment_date')} at {orbit_appointment.get('appointment_time')} with {orbit_appointment.get('doctor_name')}", 
                                                               "success")
                                            else:
                                                print(f"❌ ORBIT: No appointment returned for patient {patient_id}")
                                                
                                                # AUDIT: Log orbit skip
                                                log_audit_event(patient_id, "ORBIT", "appointment_skipped", 
                                                               f"No appointment needed (Level {triage_result.get('level', 4)})", 
                                                               "info")
                                        except Exception as e:
                                            print(f"❌ ORBIT processing error: {e}")
                                            log_audit_event(patient_id, "ORBIT", "appointment_error", 
                                                           f"Error: {str(e)}", "error")
                                            import traceback
                                            traceback.print_exc()
                                        
                                        # ============================================
                                        # GENERATE MEDIX SUGGESTION
                                        # ============================================
                                        print("\n" + "=" * 60)
                                        print("💊 STARTING MEDIX PIPELINE")
                                        print("=" * 60)
                                        
                                        medix_suggestion = None
                                        try:
                                            medix_suggestion = process_patient_for_medix(patient_id, nexus_record)
                                            if medix_suggestion:
                                                save_medix_suggestion(patient_id, medix_suggestion)
                                                print(f"✅ MEDIX suggestion saved for patient: {patient_id}")
                                                
                                                # AUDIT: Log medix
                                                log_audit_event(patient_id, "MEDIX", "suggestion_generated", 
                                                               f"Medication: {medix_suggestion.get('medication_name')} for symptom: {medix_suggestion.get('symptom')}", 
                                                               "success")
                                            else:
                                                print(f"❌ MEDIX: No suggestion returned for patient {patient_id}")
                                                log_audit_event(patient_id, "MEDIX", "suggestion_failed", 
                                                               f"No suggestion generated", "warning")
                                        except Exception as e:
                                            print(f"❌ MEDIX processing error: {e}")
                                            log_audit_event(patient_id, "MEDIX", "suggestion_error", 
                                                           f"Error: {str(e)}", "error")
                                            import traceback
                                            traceback.print_exc()
                                        
                                        # ============================================
                                        # GENERATE CARELINK CARE PLAN
                                        # ============================================
                                        print("\n" + "=" * 60)
                                        print("❤️ STARTING CARELINK PIPELINE")
                                        print("=" * 60)
                                        
                                        try:
                                            carelink_plan = process_patient_for_carelink(
                                                patient_id, 
                                                nexus_record, 
                                                medix_suggestion, 
                                                orbit_appointment
                                            )
                                            if carelink_plan:
                                                save_carelink_plan(patient_id, carelink_plan)
                                                print(f"✅ CARELINK care plan saved for patient: {patient_id}")
                                                
                                                # AUDIT: Log carelink
                                                log_audit_event(patient_id, "CARELINK", "care_plan_created", 
                                                               f"Care type: {carelink_plan.get('care_type')}, Medication: {carelink_plan.get('medication_name')}", 
                                                               "success")
                                            else:
                                                print(f"❌ CARELINK: No care plan returned for patient {patient_id}")
                                                log_audit_event(patient_id, "CARELINK", "care_plan_failed", 
                                                               f"No care plan generated", "warning")
                                        except Exception as e:
                                            print(f"❌ CARELINK processing error: {e}")
                                            log_audit_event(patient_id, "CARELINK", "care_plan_error", 
                                                           f"Error: {str(e)}", "error")
                                            import traceback
                                            traceback.print_exc()
                                        
                                        # ============================================
                                        # GENERATE DOCTOR REVIEW (Only for Emergency/High)
                                        # ============================================
                                        print("\n" + "=" * 60)
                                        print("👨‍⚕️ STARTING DOCTOR PIPELINE")
                                        print("=" * 60)
                                        
                                        try:
                                            doctor_review = process_patient_for_doctor(
                                                patient_id, 
                                                nexus_record, 
                                                triage_result, 
                                                extracted_info
                                            )
                                            if doctor_review:
                                                save_doctor_review(patient_id, doctor_review)
                                                print(f"✅ DOCTOR review saved for patient: {patient_id}")
                                                
                                                # AUDIT: Log doctor
                                                log_audit_event(patient_id, "DOCTOR", "review_created", 
                                                               f"Doctor review created for Level {triage_result.get('level', 4)}", 
                                                               "success")
                                            else:
                                                print(f"❌ DOCTOR: No review returned for patient {patient_id}")
                                                log_audit_event(patient_id, "DOCTOR", "review_skipped", 
                                                               f"No doctor review needed (Level {triage_result.get('level', 4)})", 
                                                               "info")
                                        except Exception as e:
                                            print(f"❌ DOCTOR processing error: {e}")
                                            log_audit_event(patient_id, "DOCTOR", "review_error", 
                                                           f"Error: {str(e)}", "error")
                                            import traceback
                                            traceback.print_exc()
                                            
                                    else:
                                        print(f"❌ NEXUS: No record returned for patient {patient_id}")
                                        log_audit_event(patient_id, "NEXUS", "record_failed", 
                                                       f"No record created", "error")
                                except Exception as e:
                                    print(f"❌ NEXUS processing error: {e}")
                                    log_audit_event(patient_id, "NEXUS", "record_error", 
                                                   f"Error: {str(e)}", "error")
                                    import traceback
                                    traceback.print_exc()
                                    
                            else:
                                print(f"❌ CLARITY: No summary returned for patient {patient_id}")
                                log_audit_event(patient_id, "CLARITY", "summary_failed", 
                                               f"No summary generated", "warning")
                        except Exception as e:
                            print(f"❌ CLARITY processing error: {e}")
                            log_audit_event(patient_id, "CLARITY", "summary_error", 
                                           f"Error: {str(e)}", "error")
                            import traceback
                            traceback.print_exc()
                    else:
                        print(f"⚠️ CLARITY SKIPPED: No symptom in extracted_info")
                        print(f"📊 extracted_info: {extracted_info}")
                        log_audit_event(patient_id, "CLARITY", "summary_skipped", 
                                       f"No symptom found in extracted_info", "info")
            
            completion = "I have collected enough information. Thank you for your time."
            save_conversation(patient_id, "AURA", completion)
            
            # AUDIT: Log completion
            log_audit_event(patient_id, "AURA", "conversation_completed", 
                           "Patient conversation completed successfully", "success")
            
            return {
                "response": completion,
                "is_complete": True,
                "patient_id": patient_id,
                "collected_info": extracted_info,
                "triage": triage_result,
                "triage_badge": get_priority_badge(triage_result.get("level", 4)) if triage_result else None,
                "status": "success"
            }
        
        # ---------- AURA - PURE CONVERSATION ----------
        db_history = get_conversation_history(patient_id)
        
        aura_response = get_deepseek_response(db_history)
        print(f"💬 AURA: {aura_response}\n")
        
        save_conversation(patient_id, "AURA", aura_response)
        
        # AUDIT: Log aura response (only for significant interactions)
        if len(aura_response) > 10:
            log_audit_event(patient_id, "AURA", "response_generated", 
                           f"AURA responded: {aura_response[:100]}", "success")
        
        return {
            "response": aura_response,
            "is_complete": False,
            "patient_id": patient_id,
            "status": "success"
        }
        
    except Exception as e:
        print(f"❌ Error processing AURA request: {e}")
        log_audit_event(patient_id, "AURA", "processing_error", 
                       f"Error: {str(e)}", "error")
        traceback.print_exc()
        return {
            "response": "I'm sorry, I had trouble processing that. Could you tell me again?",
            "status": "error"
        }


# ============================================
# PATIENT ENDPOINTS
# ============================================

@app.get("/api/patients")
async def list_patients():
    return {"patients": list_all_patients()}


@app.get("/api/patients/{patient_id}")
async def get_patient_data(patient_id: str):
    history = get_conversation_history(patient_id)
    info = get_patient_info(patient_id)
    
    triage = None
    if patient_id in active_sessions:
        triage = active_sessions[patient_id].get("triage")
    
    return {
        "patient_id": patient_id,
        "history": history,
        "collected_info": info,
        "triage": triage
    }


# ============================================
# SENTINEL AGENT DASHBOARD ENDPOINTS
# ============================================

@app.get("/api/dashboard/sentinel")
async def get_sentinel_dashboard():
    """Get SENTINEL agent dashboard data from database."""
    try:
        stats = get_triage_stats()
        
        return {
            "agent": "SENTINEL",
            "status": "active",
            "total_cases": stats["total"],
            "emergency_cases": stats["distribution"]["Emergency"],
            "high_priority": stats["distribution"]["High"],
            "routine_cases": stats["distribution"]["Routine"],
            "info_cases": stats["distribution"]["Information"],
            "severity_distribution": stats["distribution"],
            "recent_triages": stats["recent"],
            "message": "SENTINEL dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching SENTINEL dashboard: {e}")
        return {
            "agent": "SENTINEL",
            "status": "error",
            "message": str(e),
            "total_cases": 0,
            "emergency_cases": 0,
            "high_priority": 0,
            "routine_cases": 0,
            "info_cases": 0,
            "severity_distribution": {},
            "recent_triages": []
        }


@app.get("/api/dashboard/sentinel/patients")
async def get_sentinel_patients():
    """Get all patients with their collected info and triage results."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                p.patient_id,
                p.created_at,
                ci.symptom,
                ci.onset,
                ci.severity,
                ci.location,
                ci.additional,
                ci.medication,
                tr.priority,
                tr.level,
                tr.reason,
                tr.recommendation,
                tr.department
            FROM patients p
            LEFT JOIN collected_info ci ON p.patient_id = ci.patient_id
            LEFT JOIN triage_results tr ON p.patient_id = tr.patient_id
            GROUP BY p.patient_id
            ORDER BY p.created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        patients = []
        for row in rows:
            patients.append({
                "patient_id": row[0],
                "created_at": row[1],
                "symptom": row[2] or "Not collected",
                "onset": row[3] or "Not collected",
                "severity": row[4] or "Not collected",
                "location": row[5] or "Not collected",
                "additional": row[6] or "Not collected",
                "medication": row[7] or "Not collected",
                "triage_priority": row[8] or "Not triaged",
                "triage_level": row[9] or 4,
                "triage_reason": row[10] or "",
                "triage_recommendation": row[11] or "",
                "triage_department": row[12] or "General Medicine"
            })
        
        return {
            "patients": patients,
            "total": len(patients)
        }
        
    except Exception as e:
        print(f"Error fetching patients: {e}")
        return {
            "patients": [],
            "total": 0,
            "error": str(e)
        }


@app.get("/dashboard/sentinel", response_class=HTMLResponse)
async def sentinel_dashboard_page():
    """SENTINEL-only dashboard page"""
    try:
        with open("templates/sentinel_dashboard.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return """
        <html>
            <body style="font-family: system-ui; background: #06080d; color: #e8edf5; padding: 40px; text-align: center;">
                <h1 style="color: #ff6b6b;">🚦 SENTINEL</h1>
                <p>SENTINEL Dashboard coming soon...</p>
                <a href="/dashboard" style="color: #00f5d4;">← Back to Main Dashboard</a>
            </body>
        </html>
        """


# ============================================
# CLARITY AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/clarity")
async def get_clarity_dashboard():
    """Get CLARITY agent dashboard data."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                cs.id,
                cs.patient_id,
                cs.clinical_summary,
                cs.symptom_analysis,
                cs.missing_info,
                cs.doctor_notes,
                cs.recommendations,
                cs.created_at,
                ci.symptom,
                ci.severity,
                tr.priority,
                tr.department
            FROM clarity_summaries cs
            LEFT JOIN collected_info ci ON cs.patient_id = ci.patient_id
            LEFT JOIN triage_results tr ON cs.patient_id = tr.patient_id
            ORDER BY cs.id DESC
            LIMIT 50
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        summaries = []
        for row in rows:
            summaries.append({
                "id": row[0],
                "patient_id": row[1],
                "clinical_summary": row[2][:200] + "..." if row[2] and len(row[2]) > 200 else row[2],
                "symptom_analysis": row[3],
                "missing_info": row[4],
                "doctor_notes": row[5],
                "recommendations": row[6],
                "created_at": row[7],
                "symptom": row[8] or "Unknown",
                "severity": row[9] or "Unknown",
                "triage_priority": row[10] or "Not triaged",
                "department": row[11] or "General Medicine"
            })
        
        return {
            "agent": "CLARITY",
            "status": "active",
            "total_summaries": len(summaries),
            "summaries": summaries,
            "message": "CLARITY dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching CLARITY dashboard: {e}")
        return {
            "agent": "CLARITY",
            "status": "error",
            "message": str(e),
            "total_summaries": 0,
            "summaries": []
        }


# ============================================
# NEXUS AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/nexus")
async def get_nexus_dashboard():
    """Get NEXUS agent dashboard data."""
    try:
        records = get_all_nexus_records(limit=50)
        
        return {
            "agent": "NEXUS",
            "status": "active",
            "total_records": len(records),
            "records": records,
            "message": "NEXUS dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching NEXUS dashboard: {e}")
        return {
            "agent": "NEXUS",
            "status": "error",
            "message": str(e),
            "total_records": 0,
            "records": []
        }


# ============================================
# ORBIT AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/orbit")
async def get_orbit_dashboard():
    """Get ORBIT agent dashboard data."""
    try:
        appointments = get_all_orbit_appointments(limit=50)
        
        return {
            "agent": "ORBIT",
            "status": "active",
            "total_appointments": len(appointments),
            "appointments": appointments,
            "message": "ORBIT dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching ORBIT dashboard: {e}")
        return {
            "agent": "ORBIT",
            "status": "error",
            "message": str(e),
            "total_appointments": 0,
            "appointments": []
        }


# ============================================
# MEDIX AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/medix")
async def get_medix_dashboard():
    """Get MEDIX agent dashboard data."""
    try:
        suggestions = get_all_medix_suggestions(limit=50)
        
        return {
            "agent": "MEDIX",
            "status": "active",
            "total_suggestions": len(suggestions),
            "suggestions": suggestions,
            "message": "MEDIX dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching MEDIX dashboard: {e}")
        return {
            "agent": "MEDIX",
            "status": "error",
            "message": str(e),
            "total_suggestions": 0,
            "suggestions": []
        }


# ============================================
# CARELINK AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/carelink")
async def get_carelink_dashboard():
    """Get CARELINK agent dashboard data."""
    try:
        plans = get_all_carelink_plans(limit=50)
        
        return {
            "agent": "CARELINK",
            "status": "active",
            "total_plans": len(plans),
            "plans": plans,
            "message": "CARELINK dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching CARELINK dashboard: {e}")
        return {
            "agent": "CARELINK",
            "status": "error",
            "message": str(e),
            "total_plans": 0,
            "plans": []
        }


# ============================================
# AUDIT AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/audit")
async def get_audit_dashboard():
    """Get AUDIT agent dashboard data."""
    try:
        stats = get_audit_stats()
        logs = get_audit_logs(limit=50)
        
        return {
            "agent": "AUDIT",
            "status": "active",
            "stats": stats,
            "logs": logs,
            "message": "AUDIT dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching AUDIT dashboard: {e}")
        return {
            "agent": "AUDIT",
            "status": "error",
            "message": str(e),
            "stats": {},
            "logs": []
        }


# ============================================
# SAFETY AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/safety")
async def get_safety_dashboard():
    """Get SAFETY agent dashboard data."""
    try:
        stats = get_safety_stats()
        logs = get_safety_logs(limit=50)
        
        return {
            "agent": "SAFETY",
            "status": "active",
            "stats": stats,
            "logs": logs,
            "message": "SAFETY dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching SAFETY dashboard: {e}")
        return {
            "agent": "SAFETY",
            "status": "error",
            "message": str(e),
            "stats": {},
            "logs": []
        }


# ============================================
# DOCTOR AGENT DASHBOARD ENDPOINT
# ============================================

@app.get("/api/dashboard/doctor")
async def get_doctor_dashboard():
    """Get DOCTOR agent dashboard data."""
    try:
        stats = get_doctor_stats()
        reviews = get_all_doctor_reviews(limit=50)
        
        return {
            "agent": "DOCTOR",
            "status": "active",
            "stats": stats,
            "reviews": reviews,
            "message": "DOCTOR dashboard data retrieved successfully"
        }
        
    except Exception as e:
        print(f"Error fetching DOCTOR dashboard: {e}")
        return {
            "agent": "DOCTOR",
            "status": "error",
            "message": str(e),
            "stats": {},
            "reviews": []
        }


# ============================================
# DATABASE VIEWER ENDPOINT
# ============================================

@app.get("/api/database/view")
async def view_database():
    """Get all database data for viewing in UI."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        
        result = {}
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            data_rows = []
            for row in rows:
                data_rows.append(dict(zip(columns, row)))
            
            result[table] = {
                "columns": columns,
                "rows": data_rows,
                "count": len(data_rows)
            }
        
        conn.close()
        return {"tables": result}
        
    except Exception as e:
        print(f"Error viewing database: {e}")
        return {"error": str(e)}


# ============================================
# DASHBOARD PAGES
# ============================================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    try:
        with open("templates/dashboard.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return """
        <html>
            <body style="font-family: system-ui; background: #f0f4f8; color: #1a2332; padding: 40px; text-align: center;">
                <h1>🏥 NIGHTINGALE</h1>
                <h2 style="color: #2196F3;">Dashboard</h2>
                <p>Dashboard template not found.</p>
                <p style="color: #78909C;">Create <code>templates/dashboard.html</code> first.</p>
            </body>
        </html>
        """


# ============================================
# HEALTH AND ROOT
# ============================================

@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "NIGHTINGALE backend is running"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to NIGHTINGALE API",
        "version": "1.0.0",
        "agents": ["AURA", "SENTINEL", "CLARITY", "NEXUS", "ORBIT", "MEDIX", "CARELINK", "AUDIT", "SAFETY", "DOCTOR"],
        "endpoints": {
            "patients": "/api/patients",
            "dashboard": "/dashboard",
            "health": "/health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)