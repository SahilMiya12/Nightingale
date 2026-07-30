"""
CLARITY - Clinical Learning & AI Reasoning for Intelligent Treatment (Agent 3)
"""

import re
import json
import requests

DEEPSEEK_URL = None

def set_deepseek_url(url):
    global DEEPSEEK_URL
    DEEPSEEK_URL = url
    print(f"🧠 CLARITY DeepSeek URL: {DEEPSEEK_URL}")


def strip_think(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()


def extract_json(text: str):
    """Extract JSON from text, handling markdown code blocks"""
    if not text:
        return None

    text = strip_think(text)
    
    # Remove Markdown code blocks
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)

    # Try direct JSON
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # Find JSON object
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            if isinstance(data, dict):
                return data
    except Exception as e:
        print(f"CLARITY JSON parsing error: {e}")

    return None


def call_deepseek(prompt: str, max_tokens: int = 400, timeout: int = 45) -> str:
    """Call DeepSeek for clinical analysis"""
    if not DEEPSEEK_URL:
        print("❌ CLARITY: No DeepSeek URL set")
        return ""
    
    print("🧠 CLARITY: Sending request to DeepSeek...")
    payload = {
        "model": "deepseek-r1:1.5b",
        "prompt": prompt,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    try:
        r = requests.post(DEEPSEEK_URL, json=payload, timeout=timeout)
        r.raise_for_status()
        raw = r.json().get("response", "")
        cleaned = strip_think(raw)
        print(f"🧠 CLARITY: Response received ({len(cleaned)} chars)")
        return cleaned
    except Exception as e:
        print(f"❌ CLARITY DeepSeek error: {type(e).__name__}: {e}")
        return ""


def generate_clinical_summary(collected_info: dict, triage_info: dict = None) -> dict:
    """
    Generate clinical summary from collected patient information.
    """
    
    print("🔍 CLARITY: Generating clinical summary...")
    
    # Safe extraction - handle None values
    symptom = collected_info.get("symptom") or "Not provided"
    onset = collected_info.get("onset") or "Not provided"
    severity = collected_info.get("severity") or "Not provided"
    location = collected_info.get("location") or "Not provided"
    additional = collected_info.get("additional") or "None reported"
    medication = collected_info.get("medication") or "None reported"
    
    print(f"📊 CLARITY: symptom={symptom}, onset={onset}, severity={severity}")
    
    priority = triage_info.get("priority") if triage_info else "Not triaged"
    department = triage_info.get("department") if triage_info else "General Medicine"
    
    # Build prompt for DeepSeek
    prompt = f"""You are CLARITY, a clinical documentation assistant.

Create a structured clinical summary for healthcare professional review.

Do not diagnose. Do not prescribe medication. Do not invent information.

PATIENT:
Symptom: {symptom}
Onset: {onset}
Severity: {severity}
Location: {location}
Additional symptoms: {additional}
Medications: {medication}

TRIAGE:
Priority: {priority}
Department: {department}

Return ONLY valid JSON.

Required fields:
{{
    "clinical_summary": "",
    "symptom_analysis": "",
    "missing_info": "",
    "doctor_notes": "",
    "recommendations": ""
}}

CLINICAL ANALYSIS:"""

    response = call_deepseek(prompt, max_tokens=400, timeout=45)
    
    if not response:
        print("⚠️ CLARITY: No response from DeepSeek, using fallback")
        return {
            "clinical_summary": f"Patient reports {symptom}. Symptoms began {onset}. Reported severity is {severity}, with symptoms located at {location}.",
            "symptom_analysis": f"Primary reported symptom: {symptom}. Additional symptoms: {additional}.",
            "missing_info": "Additional information about duration, aggravating factors, relieving factors, medical history, allergies, and associated symptoms may be useful.",
            "doctor_notes": f"Symptom: {symptom}\nOnset: {onset}\nSeverity: {severity}\nLocation: {location}\nAdditional: {additional}\nMedication: {medication}\nPriority: {priority}\nDepartment: {department}",
            "recommendations": f"Clinical review by {department}. Consider further assessment based on clinical judgment."
        }
    
    result = extract_json(response)
    
    if result:
        required = ["clinical_summary", "symptom_analysis", "missing_info", "doctor_notes", "recommendations"]
        for field in required:
            if not result.get(field):
                result[field] = "Information not available"
            # Ensure all values are strings (not dicts or lists)
            if not isinstance(result[field], str):
                result[field] = str(result[field])
        print("✅ CLARITY: AI summary generated")
        return result
    
    # Fallback
    print("🔄 CLARITY: Using fallback summary")
    return {
        "clinical_summary": f"Patient reports {symptom}. Symptoms began {onset}. Reported severity is {severity}, with symptoms located at {location}.",
        "symptom_analysis": f"Primary reported symptom: {symptom}. Additional symptoms: {additional}.",
        "missing_info": "Additional information about duration, aggravating factors, relieving factors, medical history, allergies, and associated symptoms may be useful.",
        "doctor_notes": f"Symptom: {symptom}\nOnset: {onset}\nSeverity: {severity}\nLocation: {location}\nAdditional: {additional}\nMedication: {medication}\nPriority: {priority}\nDepartment: {department}",
        "recommendations": f"Clinical review by {department}. Consider further assessment based on clinical judgment."
    }


def process_patient_for_clarity(patient_id: str, collected_info: dict, triage_info: dict = None):
    """Process a patient through CLARITY to generate clinical summary"""
    
    print("\n" + "=" * 70)
    print(f"🧠 CLARITY PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ CLARITY: Missing patient ID")
        return None
    
    if not collected_info:
        print("❌ CLARITY: collected_info is empty")
        return None
    
    symptom = collected_info.get("symptom")
    if not symptom:
        print("❌ CLARITY: No symptom available")
        print(f"📊 CLARITY: collected_info = {collected_info}")
        return None
    
    print(f"✅ CLARITY: Valid symptom found: {symptom}")
    print(f"📊 CLARITY: collected_info = {collected_info}")
    print(f"📊 CLARITY: triage_info = {triage_info}")
    
    summary_data = generate_clinical_summary(collected_info, triage_info)
    
    if not summary_data:
        print("❌ CLARITY: Summary generation failed")
        return None
    
    # Ensure all values are strings
    for key in summary_data:
        if not isinstance(summary_data[key], str):
            summary_data[key] = str(summary_data[key])
    
    summary_data["patient_id"] = patient_id
    
    print("✅ CLARITY: Summary generated successfully")
    print(f"📝 CLARITY: {summary_data}")
    
    return summary_data