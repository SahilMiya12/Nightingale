"""
DOCTOR - Human-in-the-Loop Review (Agent 10)
Clinical decision support & patient care review
"""

import re
from datetime import datetime


def process_patient_for_doctor(patient_id: str, nexus_record: dict, triage_info: dict, collected_info: dict) -> dict:
    """
    Process a patient through DOCTOR for human review.
    Only triggers for EMERGENCY (Level 1) or HIGH (Level 2).
    """
    
    print("\n" + "=" * 70)
    print(f"👨‍⚕️ DOCTOR PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ DOCTOR: Missing patient ID")
        return None
    
    if not nexus_record:
        print("❌ DOCTOR: No NEXUS record provided")
        return None
    
    # Extract data from NEXUS
    unified_record = nexus_record.get("unified_record", "")
    
    # Extract triage level
    import re
    level_match = re.search(r"Level (\d)", unified_record)
    triage_level = int(level_match.group(1)) if level_match else 4
    
    # Extract symptom
    symptom_match = re.search(r"PRIMARY SYMPTOM: (.*?)(?:\n|$)", unified_record)
    symptom = symptom_match.group(1).strip() if symptom_match else "Unknown"
    
    # Extract severity
    severity_match = re.search(r"SEVERITY: (.*?)(?:\n|$)", unified_record)
    severity = severity_match.group(1).strip() if severity_match else "Not recorded"
    
    # Get triage priority
    triage_priority = triage_info.get("priority", "UNKNOWN") if triage_info else "UNKNOWN"
    
    print(f"📊 DOCTOR: Triage Level = {triage_level}")
    print(f"📊 DOCTOR: Priority = {triage_priority}")
    print(f"📊 DOCTOR: Symptom = {symptom}")
    print(f"📊 DOCTOR: Severity = {severity}")
    
    # ============================================================
    # CHECK IF DOCTOR REVIEW IS NEEDED
    # ============================================================
    # ONLY trigger for EMERGENCY (Level 1) or HIGH (Level 2)
    # For ROUTINE (Level 3) and INFORMATION (Level 4), no doctor review needed
    # ============================================================
    
    if triage_level > 2:
        print(f"⚠️ DOCTOR: Triage Level {triage_level} - No doctor review needed")
        print(f"📋 DOCTOR: Patient can be managed without doctor intervention")
        print("✅ DOCTOR: Skipping review")
        return None
    
    print(f"🚨 DOCTOR: Triage Level {triage_level} - Doctor review REQUIRED")
    
    # ============================================================
    # CREATE DOCTOR REVIEW
    # ============================================================
    
    review_data = {
        "patient_id": patient_id,
        "triage_level": triage_level,
        "triage_priority": triage_priority,
        "symptom": symptom,
        "severity": severity,
        "review_status": "pending",
        "doctor_notes": "",
        "action_taken": "",
        "reviewed_by": "",
        "reviewed_at": None
    }
    
    # Generate doctor notes based on severity
    if triage_level == 1:
        review_data["doctor_notes"] = f"🚨 EMERGENCY: Patient reports {symptom} with severity {severity}. Immediate attention required. Please review and take action."
    elif triage_level == 2:
        review_data["doctor_notes"] = f"⚠️ HIGH PRIORITY: Patient reports {symptom} with severity {severity}. Needs prompt assessment within 24-48 hours."
    
    print(f"✅ DOCTOR: Review created successfully")
    print(f"📝 DOCTOR: {review_data['doctor_notes']}")
    
    return review_data


def review_patient(patient_id: str, review_data: dict, action: str, notes: str = None, reviewed_by: str = "Dr. Default"):
    """
    Simulate a doctor reviewing and taking action on a patient.
    This is a helper function for the frontend to update review status.
    """
    
    print("\n" + "=" * 70)
    print(f"👨‍⚕️ DOCTOR REVIEWING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ DOCTOR: Missing patient ID")
        return None
    
    if not review_data:
        print("❌ DOCTOR: No review data provided")
        return None
    
    # Update review data
    review_data["review_status"] = "completed"
    review_data["action_taken"] = action
    review_data["doctor_notes"] = notes or review_data.get("doctor_notes", "")
    review_data["reviewed_by"] = reviewed_by
    review_data["reviewed_at"] = datetime.now().isoformat()
    
    print(f"✅ DOCTOR: Review completed")
    print(f"📝 Action: {action}")
    print(f"📝 Notes: {notes or 'No additional notes'}")
    print(f"👨‍⚕️ Reviewed by: {reviewed_by}")
    
    return review_data