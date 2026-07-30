"""
SENTINEL - Triage Support Agent (Agent 2)
"""

import re
import json
import requests
from datetime import datetime

DEEPSEEK_URL = None

# ---- TRIAGE RULES ----
EMERGENCY_SYMPTOMS = [
    "chest pain", "heart attack", "stroke", "severe bleeding",
    "difficulty breathing", "shortness of breath", "unconscious",
    "severe allergic reaction", "suicide", "kill myself",
    "overdose", "poison", "severe head injury",
    "cardiac arrest", "seizure", "choking", "not breathing",
    "blood in vomit", "blood in stool", "internal bleeding"
]

HIGH_PRIORITY_SYMPTOMS = [
    "fever", "high fever", "severe pain", "vomiting", "dizziness",
    "migraine", "chest discomfort", "palpitations", "confusion",
    "weakness", "numbness", "severe headache", "blood",
    "coughing blood", "severe abdominal pain", "severe back pain",
    "persistent vomiting", "dehydration"
]

def set_deepseek_url(url):
    global DEEPSEEK_URL
    DEEPSEEK_URL = url


def strip_think(text: str) -> str:
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def call_deepseek(prompt: str, max_tokens: int = 200, timeout: int = 30) -> str:
    if not DEEPSEEK_URL:
        return ""
    
    payload = {
        "model": "deepseek-r1:1.5b",
        "prompt": prompt,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    try:
        r = requests.post(DEEPSEEK_URL, json=payload, timeout=timeout)
        r.raise_for_status()
        raw = r.json().get("response", "")
        return strip_think(raw)
    except Exception as e:
        print(f"SENTINEL - DeepSeek call failed: {e}")
        return ""


def keyword_extract(patient_texts: list) -> dict:
    """Fallback: Extract info using keywords"""
    
    full_text = " ".join(patient_texts).lower()
    
    info = {
        "symptom": None,
        "onset": None,
        "severity": None,
        "location": None,
        "additional": None,
        "medication": None
    }
    
    # Extract symptom - check specific multi-word symptoms first
    symptoms = [
        # Emergency / highly specific
        "difficulty breathing",
        "shortness of breath",
        "chest pain",
        "severe abdominal pain",
        "severe back pain",
        "blood in vomit",
        "blood in stool",
        # Specific symptoms
        "knee pain",
        "leg pain",
        "back pain",
        "stomach pain",
        "abdominal pain",
        "sore throat",
        "red eyes",
        "severe headache",
        # General symptoms
        "headache",
        "migraine",
        "dizziness",
        "vomiting",
        "nausea",
        "weakness",
        "numbness",
        "fatigue",
        "fever",
        "cough",
        "pain",
        "dryness",
        "eye",
        "leg"
    ]
    
    for symptom_name in symptoms:
        if symptom_name in full_text:
            info["symptom"] = symptom_name
            break
    
    # Extract onset
    onset_words = ["today", "yesterday", "day", "hour", "week", "month", "year", "ago", "since", "before"]
    for word in onset_words:
        if word in full_text:
            match = re.search(r"(\d+)\s*(day|hour|week|month|year)", full_text)
            if match:
                info["onset"] = f"{match.group(1)} {match.group(2)}(s) ago"
            else:
                info["onset"] = word
            break
    
    # Extract severity
    if "severe" in full_text or "very bad" in full_text:
        info["severity"] = "severe"
    elif "moderate" in full_text:
        info["severity"] = "moderate"
    elif "little" in full_text or "mild" in full_text or "not much" in full_text:
        info["severity"] = "mild"
    else:
        match = re.search(r"(\d+)\s*(?:/10|out of 10)", full_text)
        if match:
            num = int(match.group(1))
            if num >= 7:
                info["severity"] = "severe"
            elif num >= 4:
                info["severity"] = "moderate"
            else:
                info["severity"] = "mild"
    
    # Extract location
    locations = ["head", "chest", "stomach", "back", "leg", "lower leg", "upper leg", 
                 "arm", "eye", "throat", "neck", "shoulder", "knee", "abdomen",
                 "chest", "spine", "joint", "muscle"]
    for loc in locations:
        if loc in full_text:
            info["location"] = loc
            break
    
    # Extract additional symptoms
    additional_keywords = ["also", "plus", "and", "along with", "additionally"]
    additional_phrases = []
    for word in additional_keywords:
        if word in full_text:
            parts = full_text.split(word, 1)
            if len(parts) > 1:
                additional_phrases.append(parts[1].strip()[:50])
    if additional_phrases:
        info["additional"] = " ".join(additional_phrases)[:100]
    
    # Extract medication
    med_patterns = [r"(?:taking|on|using|prescribed)\s+([a-z]+)", r"medication\s+([a-z]+)", r"tablet\s+([a-z]+)"]
    for pattern in med_patterns:
        match = re.search(pattern, full_text)
        if match:
            info["medication"] = match.group(1)
            break
    
    return info


def sentinel_extract_info(conversation_history: list) -> dict:
    """Extract structured information from conversation - NO CACHING for reliability"""
    
    empty_result = {
        "symptom": None,
        "onset": None,
        "severity": None,
        "location": None,
        "additional": None,
        "medication": None
    }

    if not conversation_history:
        print("❌ SENTINEL: Conversation history is empty")
        return empty_result

    # Get patient messages
    patient_texts = []
    for item in conversation_history:
        if item.get("role") == "Patient":
            message = (item.get("message", "") or "").strip()
            if message:
                patient_texts.append(message)

    if not patient_texts:
        print("❌ SENTINEL: No patient messages found")
        return empty_result

    print(f"📋 SENTINEL: Found {len(patient_texts)} patient messages")

    # Build conversation text
    conversation_text = "\n".join([
        f"{item.get('role', 'Unknown')}: {item.get('message', '')}"
        for item in conversation_history
        if item.get("role") in ["Patient", "AURA"]
    ])

    # Try DeepSeek extraction
    prompt = f"""
Extract medical information from this conversation.

CONVERSATION:
{conversation_text}

Extract ONLY:
- symptom: main complaint
- onset: when it started
- severity: mild/moderate/severe
- location: where on body
- additional: other symptoms
- medication: medications taken

Return ONLY JSON:
{{"symptom": null, "onset": null, "severity": null, "location": null, "additional": null, "medication": null}}
"""

    print("🧠 SENTINEL: Calling DeepSeek for extraction...")
    response = call_deepseek(prompt, max_tokens=200, timeout=30)

    if response:
        try:
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                result = json.loads(match.group())
                # Clean up null values
                for key in result:
                    if result[key] in ["null", "None", ""]:
                        result[key] = None
                if result.get("symptom"):
                    print(f"✅ SENTINEL: DeepSeek extraction successful: {result}")
                    return result
        except Exception as e:
            print(f"⚠️ SENTINEL: Extraction failed: {e}")

    # Fallback to keyword extraction
    print("🔄 SENTINEL: Using keyword extraction fallback")
    result = keyword_extract(patient_texts)
    print(f"📋 SENTINEL: Fallback result: {result}")
    return result


def run_sentinel(collected_info: dict) -> dict:
    """Triage based on extracted info"""
    
    symptom = collected_info.get("symptom", "") or ""
    severity = collected_info.get("severity", "") or ""
    additional = collected_info.get("additional", "") or ""
    location = collected_info.get("location", "") or ""
    
    all_text = f"{symptom} {additional} {location}".lower()
    
    print(f"SENTINEL: symptom={symptom}, severity={severity}, location={location}")
    
    # Emergency
    for keyword in EMERGENCY_SYMPTOMS:
        if keyword in all_text:
            return {
                "priority": "EMERGENCY",
                "level": 1,
                "reason": f"Patient reported '{keyword}' - immediate attention needed.",
                "recommendation": "CALL EMERGENCY SERVICES (911/112/108) IMMEDIATELY.",
                "department": "Emergency"
            }
    
    # High priority
    if severity:
        severity_num = extract_severity_number(severity)
        if severity_num and severity_num >= 7:
            return {
                "priority": "HIGH",
                "level": 2,
                "reason": f"Severity level of {severity_num}/10 indicates urgent attention.",
                "recommendation": "Seek medical assessment within 24 hours.",
                "department": determine_department(symptom, location)
            }
    
    for keyword in HIGH_PRIORITY_SYMPTOMS:
        if keyword in all_text:
            return {
                "priority": "HIGH",
                "level": 2,
                "reason": f"Patient reported '{keyword}' - prompt assessment needed.",
                "recommendation": "Schedule appointment within 24-48 hours.",
                "department": determine_department(symptom, location)
            }
    
    # Routine
    if symptom:
        return {
            "priority": "ROUTINE",
            "level": 3,
            "reason": f"Patient reported '{symptom}'. No urgency indicators.",
            "recommendation": "Schedule routine consultation within a week.",
            "department": determine_department(symptom, location)
        }
    
    # Information only
    return {
        "priority": "INFORMATION",
        "level": 4,
        "reason": "General information provided without specific symptoms.",
        "recommendation": "Follow-up for additional information.",
        "department": "General Medicine"
    }


def extract_severity_number(severity: str) -> int:
    """Extract severity number from text"""
    if not severity:
        return 0
    
    severity = severity.lower()
    
    patterns = [
        r'\b([1-9]|10)\s*[/-]\s*(10)',
        r'\b([1-9]|10)\s+out\s+of\s+10',
        r'\b([1-9]|10)\b'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, severity)
        if match:
            return int(match.group(1))
    
    if "severe" in severity:
        return 8
    elif "moderate" in severity:
        return 5
    elif "mild" in severity:
        return 3
    
    return 0


def determine_department(symptom: str, location: str) -> str:
    """Determine appropriate department based on symptoms"""
    symptom = symptom.lower() if symptom else ""
    location = location.lower() if location else ""
    combined = f"{symptom} {location}"
    
    if any(word in combined for word in ["head", "brain", "migraine", "dizziness", "vertigo", "neurological"]):
        return "Neurology"
    if any(word in combined for word in ["chest", "heart", "palpitations", "cardiac", "cardiovascular"]):
        return "Cardiology"
    if any(word in combined for word in ["stomach", "abdomen", "nausea", "vomiting", "gastric", "digestive"]):
        return "Gastroenterology"
    if any(word in combined for word in ["leg", "bone", "joint", "muscle", "back", "spine", "knee", "orthopedic"]):
        return "Orthopedics"
    if any(word in combined for word in ["eye", "vision", "red eye", "blurred", "ophthalmic"]):
        return "Ophthalmology"
    if any(word in combined for word in ["skin", "rash", "allergy", "hives", "dermatological"]):
        return "Dermatology"
    if any(word in combined for word in ["cough", "breath", "lung", "asthma", "respiratory"]):
        return "Pulmonology"
    if any(word in combined for word in ["urine", "kidney", "bladder", "renal"]):
        return "Nephrology"
    
    return "General Medicine"


def get_priority_color(level: int) -> str:
    """Get color for priority level"""
    colors = {
        1: "#FF0000",  # Emergency - Red
        2: "#FF6B00",  # High - Orange
        3: "#FFC107",  # Routine - Yellow
        4: "#4CAF50"   # Information - Green
    }
    return colors.get(level, "#888888")


def get_priority_badge(level: int) -> str:
    """Get badge text for priority level"""
    badges = {
        1: "EMERGENCY",
        2: "HIGH",
        3: "ROUTINE",
        4: "INFORMATION"
    }
    return badges.get(level, "UNKNOWN")