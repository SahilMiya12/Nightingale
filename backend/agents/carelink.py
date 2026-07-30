"""
CARELINK - Continuous Assistance, Recovery & Engagement Link (Agent 7)
Patient follow-up, reminders and engagement
"""

import os
import json
from datetime import datetime, timedelta


def send_voice_reminder(message: str):
    """
    Send a voice reminder using Mac's 'say' command.
    """
    try:
        os.system(f'say "{message}"')
        print(f"🔊 VOICE REMINDER: {message}")
    except Exception as e:
        print(f"❌ Voice reminder failed: {e}")


def create_care_plan(patient_id: str, nexus_record: dict, medix_suggestion: dict = None, orbit_appointment: dict = None) -> dict:
    """
    Create a care plan for the patient based on MEDIX and ORBIT.
    """
    
    print("\n" + "=" * 70)
    print(f"❤️ CARELINK CREATING CARE PLAN FOR: {patient_id}")
    print("=" * 70)
    
    # Extract data from NEXUS
    unified_record = nexus_record.get("unified_record", "")
    
    # Extract symptom
    import re
    symptom_match = re.search(r"PRIMARY SYMPTOM: (.*?)(?:\n|$)", unified_record)
    symptom = symptom_match.group(1).strip() if symptom_match else "Unknown"
    
    # Extract triage level
    level_match = re.search(r"Level (\d)", unified_record)
    triage_level = int(level_match.group(1)) if level_match else 4
    
    # Determine care type
    care_type = "medication"  # Default
    
    # If ORBIT booked an appointment, it's post-visit care
    if orbit_appointment:
        care_type = "post_visit"
        print(f"📋 CARELINK: Post-visit care plan (patient visited hospital)")
    else:
        print(f"📋 CARELINK: Medication care plan (home treatment)")
    
    # Get medication info from MEDIX
    medication_name = "No medication needed"
    dosage = "Not applicable"
    frequency_hours = 6
    duration_days = 3
    
    if medix_suggestion:
        medication_name = medix_suggestion.get("medication_name", "No medication needed")
        dosage = medix_suggestion.get("dosage", "Not applicable")
        
        # Set frequency based on medication type
        if "Paracetamol" in medication_name or "Crocin" in medication_name:
            frequency_hours = 6
            duration_days = 3
        elif "Cetirizine" in medication_name:
            frequency_hours = 24
            duration_days = 5
        elif "Digene" in medication_name or "Gelusil" in medication_name:
            frequency_hours = 8
            duration_days = 2
        else:
            frequency_hours = 6
            duration_days = 3
    
    # Create check-in questions
    check_in_questions = json.dumps([
        {
            "day": 1,
            "question": f"How is your {symptom} today? Rate 1-10 (1=better, 10=worse)",
            "time": "morning"
        },
        {
            "day": 2,
            "question": f"Are you feeling better than yesterday? (yes/no)",
            "time": "morning"
        },
        {
            "day": 3,
            "question": f"Have you been taking your medication regularly? (yes/no)",
            "time": "morning"
        }
    ])
    
    plan_data = {
        "care_type": care_type,
        "medication_name": medication_name,
        "dosage": dosage,
        "frequency_hours": frequency_hours,
        "duration_days": duration_days,
        "water_reminder": True,
        "rest_reminder": True,
        "check_in_questions": check_in_questions,
        "status": "active"
    }
    
    print(f"📋 CARELINK: Care Plan Created")
    print(f"   - Type: {care_type}")
    print(f"   - Medication: {medication_name}")
    print(f"   - Frequency: Every {frequency_hours} hours")
    print(f"   - Duration: {duration_days} days")
    print(f"   - Water Reminder: Yes")
    print(f"   - Rest Reminder: Yes")
    
    # Send initial voice reminder
    if medication_name != "No medication needed":
        send_voice_reminder(f"💊 Time to take your {medication_name}. {dosage}")
    else:
        send_voice_reminder(f"🛌 Please rest and stay hydrated. Your condition is mild.")
    
    if care_type == "post_visit":
        send_voice_reminder(f"📅 Remember to follow your doctor's advice. Take it easy today.")
    
    return plan_data


def process_patient_for_carelink(patient_id: str, nexus_record: dict, medix_suggestion: dict = None, orbit_appointment: dict = None) -> dict:
    """
    Process a patient through CARELINK to create a care plan.
    """
    
    print("\n" + "=" * 70)
    print(f"❤️ CARELINK PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ CARELINK: Missing patient ID")
        return None
    
    if not nexus_record:
        print("❌ CARELINK: No NEXUS record provided")
        return None
    
    # Create care plan
    plan_data = create_care_plan(patient_id, nexus_record, medix_suggestion, orbit_appointment)
    
    print("✅ CARELINK: Care plan created successfully")
    
    return plan_data