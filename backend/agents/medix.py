"""
MEDIX - Medical Evaluation & Drug Intelligence eXpert (Agent 6)
Medication validation and drug safety
"""

import re


def get_medication_suggestion(symptom: str, severity: str, triage_level: int) -> dict:
    """
    Suggest medication and home remedies based on symptom and severity.
    """
    
    symptom = symptom.lower() if symptom else ""
    
    # ============================================================
    # EMERGENCY (Level 1) - Only emergency advice
    # ============================================================
    if triage_level == 1:
        return {
            "medication_name": "DO NOT TAKE ANY MEDICATION",
            "dosage": "DO NOT TAKE ANY MEDICATION",
            "home_remedy": "CALL EMERGENCY SERVICES (911/112/108) IMMEDIATELY",
            "warning": "🚨 EMERGENCY: Please seek immediate medical attention. Do not self-medicate.",
            "is_emergency": True
        }
    
    # ============================================================
    # HIGH (Level 2) - Urgent, but can take temporary relief
    # ============================================================
    if triage_level == 2:
        if "headache" in symptom or "migraine" in symptom:
            return {
                "medication_name": "Paracetamol 500mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Rest in a dark, quiet room. Apply cold compress to forehead. Stay hydrated.",
                "warning": "⚠️ If headache persists or worsens within 24 hours, please consult a doctor.",
                "is_emergency": False
            }
        elif "fever" in symptom:
            return {
                "medication_name": "Crocin 650mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Apply cold compress on forehead. Stay hydrated. Rest.",
                "warning": "⚠️ If fever persists for more than 48 hours, consult a doctor.",
                "is_emergency": False
            }
        elif "pain" in symptom or "stomach" in symptom or "abdominal" in symptom:
            return {
                "medication_name": "Paracetamol 500mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Apply warm compress to the abdomen. Take small sips of water. Avoid heavy meals.",
                "warning": "⚠️ If pain persists or worsens within 24 hours, consult a doctor immediately.",
                "is_emergency": False
            }
        else:
            return {
                "medication_name": "Paracetamol 500mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Rest and stay hydrated. Monitor symptoms closely.",
                "warning": "⚠️ Please consult a doctor if symptoms persist or worsen.",
                "is_emergency": False
            }
    
    # ============================================================
    # ROUTINE (Level 3) - OTC medicines + home remedies
    # ============================================================
    if triage_level == 3:
        # Headache / Migraine
        if "headache" in symptom or "migraine" in symptom:
            return {
                "medication_name": "Paracetamol 500mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Drink plenty of water. Rest in a quiet, dark room. Apply cold compress to forehead.",
                "warning": "✅ If symptoms persist for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Fever
        elif "fever" in symptom:
            return {
                "medication_name": "Crocin 650mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Drink warm fluids (water, soup, herbal tea). Take rest. Apply cold compress.",
                "warning": "✅ If fever persists for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Cold / Cough / Sore Throat
        elif "cold" in symptom or "cough" in symptom or "sore throat" in symptom:
            return {
                "medication_name": "Cetirizine 10mg (for allergy) OR Cough Syrup",
                "dosage": "Cetirizine: 1 tablet once daily. Cough Syrup: 10ml 3 times daily.",
                "home_remedy": "Drink warm water with honey and ginger. Steam inhalation. Salt water gargle.",
                "warning": "✅ If symptoms persist for more than 5 days, consult a doctor.",
                "is_emergency": False
            }
        # Stomach / Abdominal / Acidity / Gas
        elif "stomach" in symptom or "abdominal" in symptom or "acidity" in symptom or "gas" in symptom:
            return {
                "medication_name": "Digene or Gelusil",
                "dosage": "1 tablet after meals",
                "home_remedy": "Drink warm water. Avoid spicy and oily food. Small frequent meals.",
                "warning": "✅ If pain persists for more than 2 days, consult a doctor.",
                "is_emergency": False
            }
        # Nausea / Vomiting
        elif "nausea" in symptom or "vomiting" in symptom:
            return {
                "medication_name": "Emeset 4mg (Ondansetron)",
                "dosage": "1 tablet 3 times daily",
                "home_remedy": "Drink ginger tea. Eat small, frequent meals. Avoid strong odors.",
                "warning": "✅ If vomiting persists for more than 24 hours, consult a doctor.",
                "is_emergency": False
            }
        # Back Pain / Muscle Pain / Body Pain
        elif "back pain" in symptom or "muscle pain" in symptom or "body pain" in symptom:
            return {
                "medication_name": "Paracetamol 500mg OR Combiflam",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Apply warm compress. Gentle stretching. Rest.",
                "warning": "✅ If pain persists for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # General Pain (fallback)
        elif "pain" in symptom:
            return {
                "medication_name": "Paracetamol 500mg",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Rest, rest, rest! Apply warm/cold compress as needed. Stay hydrated.",
                "warning": "✅ If pain persists for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Allergy / Rash / Itching
        elif "allergy" in symptom or "rash" in symptom or "itching" in symptom:
            return {
                "medication_name": "Cetirizine 10mg",
                "dosage": "1 tablet once daily",
                "home_remedy": "Apply cold compress. Avoid scratching. Use calamine lotion.",
                "warning": "✅ If rash spreads or worsens, consult a doctor.",
                "is_emergency": False
            }
        # Dizziness / Vertigo
        elif "dizziness" in symptom or "vertigo" in symptom:
            return {
                "medication_name": "Vertin 16mg (Betahistine)",
                "dosage": "1 tablet 3 times daily",
                "home_remedy": "Rest in a comfortable position. Avoid sudden movements. Stay hydrated.",
                "warning": "✅ If dizziness persists for more than 2 days, consult a doctor.",
                "is_emergency": False
            }
        # General fallback
        else:
            return {
                "medication_name": "Paracetamol 500mg (if safe for you)",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Rest, drink plenty of fluids, and monitor your symptoms.",
                "warning": "✅ If symptoms persist for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
    
    # ============================================================
    # INFORMATION (Level 4) - Home remedies + lifestyle advice
    # ============================================================
    if triage_level == 4:
        # Headache
        if "headache" in symptom:
            return {
                "medication_name": "Rest and hydration are recommended. No medication needed.",
                "dosage": "Not applicable",
                "home_remedy": "Drink water. Rest in a quiet, dark room. Deep breathing exercises.",
                "warning": "✅ If symptoms persist for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Fever
        elif "fever" in symptom:
            return {
                "medication_name": "Rest and hydration. Crocin 650mg (if needed).",
                "dosage": "1 tablet every 6 hours (max 4 tablets per day)",
                "home_remedy": "Stay hydrated with warm fluids. Rest. Cold compress for comfort.",
                "warning": "✅ If fever persists for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Cold / Cough
        elif "cold" in symptom or "cough" in symptom:
            return {
                "medication_name": "No medication needed for mild symptoms.",
                "dosage": "Not applicable",
                "home_remedy": "Warm water with honey and ginger. Steam inhalation. Salt water gargle.",
                "warning": "✅ If symptoms persist for more than 5 days, consult a doctor.",
                "is_emergency": False
            }
        # Stomach / Acidity
        elif "stomach" in symptom or "abdominal" in symptom or "acidity" in symptom:
            return {
                "medication_name": "Digene or Gelusil (if needed)",
                "dosage": "1 tablet after meals",
                "home_remedy": "Light meals. Avoid spicy and oily food. Drink warm water.",
                "warning": "✅ If pain persists for more than 2 days, consult a doctor.",
                "is_emergency": False
            }
        # Pain
        elif "pain" in symptom:
            return {
                "medication_name": "Rest and hydration are recommended.",
                "dosage": "Not applicable",
                "home_remedy": "Rest, apply warm/cold compress as needed. Stay hydrated.",
                "warning": "✅ If pain persists for more than 3 days, consult a doctor.",
                "is_emergency": False
            }
        # Allergy
        elif "allergy" in symptom or "rash" in symptom:
            return {
                "medication_name": "Cetirizine 10mg (if needed)",
                "dosage": "1 tablet once daily",
                "home_remedy": "Avoid allergens. Apply cold compress. Use calamine lotion.",
                "warning": "✅ If symptoms persist, consult a doctor.",
                "is_emergency": False
            }
        # Dizziness
        elif "dizziness" in symptom:
            return {
                "medication_name": "No medication needed. Rest is recommended.",
                "dosage": "Not applicable",
                "home_remedy": "Rest in a comfortable position. Drink water. Avoid sudden movements.",
                "warning": "✅ If dizziness persists for more than 2 days, consult a doctor.",
                "is_emergency": False
            }
        else:
            return {
                "medication_name": "No medication needed.",
                "dosage": "Not applicable",
                "home_remedy": "Get plenty of rest, stay hydrated, and monitor your symptoms.",
                "warning": "✅ If symptoms persist, consult a doctor.",
                "is_emergency": False
            }
    
    # Default fallback
    return {
        "medication_name": "No specific medication recommended",
        "dosage": "Not applicable",
        "home_remedy": "Rest, stay hydrated, and monitor your symptoms.",
        "warning": "✅ If symptoms persist for more than 3 days, consult a doctor.",
        "is_emergency": False
    }


def process_patient_for_medix(patient_id: str, nexus_record: dict) -> dict:
    """
    Process a patient through MEDIX to suggest medication and home remedies.
    Reads from NEXUS record.
    """
    
    print("\n" + "=" * 70)
    print(f"💊 MEDIX PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ MEDIX: Missing patient ID")
        return None
    
    if not nexus_record:
        print("❌ MEDIX: No NEXUS record provided")
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
    
    print(f"📊 MEDIX: Triage Level = {triage_level}")
    print(f"📊 MEDIX: Symptom = {symptom}")
    print(f"📊 MEDIX: Severity = {severity}")
    
    # Get medication suggestion
    suggestion = get_medication_suggestion(symptom, severity, triage_level)
    
    # Add additional data
    suggestion["symptom"] = symptom
    suggestion["severity"] = severity
    suggestion["triage_level"] = triage_level
    
    print(f"📊 MEDIX: Medication = {suggestion['medication_name']}")
    print(f"📊 MEDIX: Home Remedy = {suggestion['home_remedy']}")
    print(f"📊 MEDIX: Warning = {suggestion['warning']}")
    
    if suggestion.get("is_emergency"):
        print("🚨 MEDIX: EMERGENCY - Do not self-medicate!")
    else:
        print("✅ MEDIX: Medication suggestion generated successfully")
    
    return suggestion