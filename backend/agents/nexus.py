"""
NEXUS - Networked Electronic eXchange for Unified Storage (Agent 4)
Unified patient records and medical history
"""

import json
from datetime import datetime


def generate_unified_record(patient_id: str, collected_info: dict, triage_info: dict, clarity_summary: dict = None) -> dict:
    """
    Generate a unified patient record from all available data.
    """
    
    print("\n" + "=" * 60)
    print("📋 NEXUS: Generating unified record")
    print("=" * 60)
    
    # Extract from collected_info
    symptom = collected_info.get("symptom") or "Not recorded"
    onset = collected_info.get("onset") or "Not recorded"
    severity = collected_info.get("severity") or "Not recorded"
    location = collected_info.get("location") or "Not recorded"
    additional = collected_info.get("additional") or "None"
    medication = collected_info.get("medication") or "None"
    
    # Extract from triage
    priority = triage_info.get("priority") if triage_info else "Not triaged"
    level = triage_info.get("level") if triage_info else 4
    department = triage_info.get("department") if triage_info else "General Medicine"
    
    # Extract from clarity
    clinical_summary = clarity_summary.get("clinical_summary") if clarity_summary else "Not available"
    
    # Build unified record
    unified_record = f"""
PATIENT ID: {patient_id}
PRIMARY SYMPTOM: {symptom}
ONSET: {onset}
SEVERITY: {severity}
LOCATION: {location}
ADDITIONAL SYMPTOMS: {additional}
CURRENT MEDICATION: {medication}
TRIAGE PRIORITY: {priority} (Level {level})
RECOMMENDED DEPARTMENT: {department}
CLINICAL SUMMARY: {clinical_summary}
    """.strip()
    
    # Build medical history (structured)
    medical_history = f"""
- Primary Symptom: {symptom}
- Onset: {onset}
- Severity: {severity}
- Location: {location}
- Triage Priority: {priority}
- Department: {department}
    """.strip()
    
    return {
        "unified_record": unified_record,
        "medical_history": medical_history,
        "allergies": "None reported",
        "chronic_conditions": "None reported",
        "past_surgeries": "None reported",
        "family_history": "None reported",
        "lifestyle_factors": "Not documented"
    }


def process_patient_for_nexus(patient_id: str, collected_info: dict, triage_info: dict, clarity_summary: dict = None) -> dict:
    """
    Process a patient through NEXUS to generate unified record.
    """
    
    print("\n" + "=" * 70)
    print(f"📋 NEXUS PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ NEXUS: Missing patient ID")
        return None
    
    if not collected_info:
        print("❌ NEXUS: No collected_info provided")
        return None
    
    symptom = collected_info.get("symptom")
    if not symptom:
        print("⚠️ NEXUS: No symptom found, but will still create record")
    
    record_data = generate_unified_record(patient_id, collected_info, triage_info, clarity_summary)
    
    print("✅ NEXUS: Unified record generated successfully")
    
    return record_data