"""
ORBIT - Operational Resource & Booking Intelligent Tracker (Agent 5)
Appointment scheduling and resource management
"""

from datetime import datetime, timedelta


def determine_urgency(triage_level: int) -> dict:
    """
    Determine appointment urgency based on triage level.
    """
    if triage_level == 1:  # EMERGENCY
        return {
            "urgency": "emergency",
            "days_to_book": 0,  # Today
            "priority_text": "🚨 IMMEDIATE - Book today!",
            "status": "emergency"
        }
    elif triage_level == 2:  # HIGH
        return {
            "urgency": "urgent",
            "days_to_book": 1,  # Tomorrow
            "priority_text": "🔴 URGENT - Book within 24-48 hours",
            "status": "urgent"
        }
    elif triage_level == 3:  # ROUTINE
        return {
            "urgency": "routine",
            "days_to_book": 3,  # Within 3-5 days
            "priority_text": "🟡 ROUTINE - Book within a week",
            "status": "routine"
        }
    else:  # INFORMATION (level 4)
        return {
            "urgency": "information",
            "days_to_book": 7,  # Within a week
            "priority_text": "🟢 INFORMATION - Book within 2 weeks",
            "status": "routine"
        }


def get_doctor_for_department(department: str) -> str:
    """
    Assign a doctor based on department.
    """
    doctors = {
        "Neurology": "Dr. Sharma",
        "Cardiology": "Dr. Patel",
        "Gastroenterology": "Dr. Mehta",
        "Orthopedics": "Dr. Singh",
        "Ophthalmology": "Dr. Gupta",
        "Dermatology": "Dr. Reddy",
        "Pulmonology": "Dr. Joshi",
        "Nephrology": "Dr. Kumar",
        "General Medicine": "Dr. Rao",
        "Emergency": "Dr. Emergency"
    }
    return doctors.get(department, "Dr. Rao")


def generate_appointment_time(urgency: str) -> tuple:
    """
    Generate appointment date and time based on urgency.
    """
    now = datetime.now()
    
    if urgency == "emergency":
        days_to_add = 0
        time_slot = "09:00 AM"  # First available
    elif urgency == "urgent":
        days_to_add = 1
        time_slot = "10:30 AM"
    elif urgency == "routine":
        days_to_add = 3
        time_slot = "02:00 PM"
    else:
        days_to_add = 7
        time_slot = "03:30 PM"
    
    appointment_date = (now + timedelta(days=days_to_add)).strftime("%Y-%m-%d")
    return appointment_date, time_slot


def process_patient_for_orbit(patient_id: str, nexus_record: dict) -> dict:
    """
    Process a patient through ORBIT to book an appointment.
    ONLY books for EMERGENCY (Level 1) and HIGH (Level 2).
    Reads from NEXUS record.
    """
    
    print("\n" + "=" * 70)
    print(f"📅 ORBIT PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ ORBIT: Missing patient ID")
        return None
    
    if not nexus_record:
        print("❌ ORBIT: No NEXUS record provided")
        return None
    
    # Extract data from NEXUS
    unified_record = nexus_record.get("unified_record", "")
    
    # Parse triage info from unified record
    triage_level = 4  # Default
    
    # Try to extract triage level from unified record
    import re
    level_match = re.search(r"Level (\d)", unified_record)
    if level_match:
        triage_level = int(level_match.group(1))
    
    # Extract department
    department_match = re.search(r"RECOMMENDED DEPARTMENT: (.*?)(?:\n|$)", unified_record)
    department = department_match.group(1).strip() if department_match else "General Medicine"
    
    # Extract symptom
    symptom_match = re.search(r"PRIMARY SYMPTOM: (.*?)(?:\n|$)", unified_record)
    symptom = symptom_match.group(1).strip() if symptom_match else "Unknown"
    
    print(f"📊 ORBIT: Triage Level = {triage_level}")
    print(f"📊 ORBIT: Department = {department}")
    print(f"📊 ORBIT: Symptom = {symptom}")
    
    # ============================================================
    # CHECK IF APPOINTMENT IS NEEDED
    # ============================================================
    # ONLY book for EMERGENCY (Level 1) or HIGH (Level 2)
    # For ROUTINE (Level 3) and INFORMATION (Level 4), MEDIX will handle
    # ============================================================
    
    if triage_level > 2:
        print(f"⚠️ ORBIT: Triage Level {triage_level} - No appointment needed")
        print(f"📋 ORBIT: Patient can be managed with medication/home remedies")
        print("✅ ORBIT: Skipping appointment booking")
        return None
    
    print(f"✅ ORBIT: Triage Level {triage_level} - Appointment needed")
    
    # Determine urgency
    urgency_info = determine_urgency(triage_level)
    print(f"📊 ORBIT: Urgency = {urgency_info['urgency']}")
    print(f"📊 ORBIT: Priority = {urgency_info['priority_text']}")
    
    # Assign doctor
    doctor_name = get_doctor_for_department(department)
    print(f"📊 ORBIT: Assigned Doctor = {doctor_name}")
    
    # Generate appointment time
    appointment_date, appointment_time = generate_appointment_time(urgency_info['urgency'])
    print(f"📊 ORBIT: Appointment Date = {appointment_date}")
    print(f"📊 ORBIT: Appointment Time = {appointment_time}")
    
    # Create appointment data
    appointment_data = {
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "doctor_name": doctor_name,
        "department": department,
        "urgency": urgency_info['urgency'],
        "status": "scheduled",
        "notes": f"Patient: {symptom} - {urgency_info['priority_text']}"
    }
    
    print("✅ ORBIT: Appointment booked successfully")
    print(f"📝 ORBIT: {appointment_data}")
    
    return appointment_data