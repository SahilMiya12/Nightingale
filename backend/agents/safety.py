"""
SAFETY - Safety & Policy Engine (Agent 9)
Clinical Safety Rules & Guardrails
"""

import re
from datetime import datetime


# ============================================================
# SAFETY RULES
# ============================================================

# Emergency keywords that trigger immediate safety alerts
EMERGENCY_ALERT_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "severe bleeding",
    "difficulty breathing", "shortness of breath", "unconscious",
    "severe allergic reaction", "suicide", "kill myself",
    "overdose", "poison", "severe head injury",
    "cardiac arrest", "seizure", "choking", "not breathing",
    "blood in vomit", "blood in stool", "internal bleeding"
]

# High priority keywords
HIGH_PRIORITY_KEYWORDS = [
    "fever", "high fever", "severe pain", "vomiting", "dizziness",
    "migraine", "chest discomfort", "palpitations", "confusion",
    "weakness", "numbness", "severe headache", "blood",
    "coughing blood", "severe abdominal pain", "severe back pain"
]

# Medication safety rules (simple drug-drug interactions)
MEDICATION_SAFETY_RULES = {
    "paracetamol": {
        "max_daily_dose": 4000,  # mg
        "warnings": ["Liver damage risk with alcohol", "Do not exceed 4g per day"]
    },
    "crocin": {
        "max_daily_dose": 4000,
        "warnings": ["Liver damage risk with alcohol", "Do not exceed 4g per day"]
    },
    "cetirizine": {
        "max_daily_dose": 10,
        "warnings": ["May cause drowsiness", "Avoid alcohol"]
    },
    "digene": {
        "max_daily_dose": 6,
        "warnings": ["Do not exceed 6 tablets per day", "May cause constipation"]
    },
    "gelusil": {
        "max_daily_dose": 6,
        "warnings": ["Do not exceed 6 tablets per day", "May cause constipation"]
    },
    "ondansetron": {
        "max_daily_dose": 24,
        "warnings": ["May cause headache", "Do not exceed 24mg per day"]
    },
    "combiflam": {
        "max_daily_dose": 4,
        "warnings": ["Contains ibuprofen", "Do not exceed 4 tablets per day"]
    },
    "vertin": {
        "max_daily_dose": 48,
        "warnings": ["May cause drowsiness", "Do not exceed 48mg per day"]
    }
}


def check_emergency_keywords(text: str) -> tuple:
    """
    Check if text contains emergency keywords.
    Returns (is_emergency, matched_keywords)
    """
    text_lower = text.lower()
    matched = []
    
    for keyword in EMERGENCY_ALERT_KEYWORDS:
        if keyword in text_lower:
            matched.append(keyword)
    
    return len(matched) > 0, matched


def check_high_priority_keywords(text: str) -> tuple:
    """
    Check if text contains high priority keywords.
    Returns (is_high_priority, matched_keywords)
    """
    text_lower = text.lower()
    matched = []
    
    for keyword in HIGH_PRIORITY_KEYWORDS:
        if keyword in text_lower:
            matched.append(keyword)
    
    return len(matched) > 0, matched


def check_medication_safety(medication_name: str, dosage: str = None) -> dict:
    """
    Check medication safety rules.
    Returns dict with warnings and max dose.
    """
    med_name = medication_name.lower()
    
    # Find matching medication rule
    for rule_name, rule_data in MEDICATION_SAFETY_RULES.items():
        if rule_name in med_name:
            return {
                "safe": True,
                "max_daily_dose": rule_data.get("max_daily_dose"),
                "warnings": rule_data.get("warnings", [])
            }
    
    return {
        "safe": True,
        "max_daily_dose": None,
        "warnings": ["Unknown medication - please consult a doctor"]
    }


def validate_patient_data(collected_info: dict, triage_info: dict = None) -> dict:
    """
    Run all safety rules on patient data.
    """
    
    print("\n" + "=" * 70)
    print("🛡️ SAFETY: Validating patient data")
    print("=" * 70)
    
    results = {
        "passed": True,
        "checks": [],
        "warnings": [],
        "errors": [],
        "emergency_alert": False
    }
    
    # Extract data
    symptom = collected_info.get("symptom", "") or ""
    additional = collected_info.get("additional", "") or ""
    medication = collected_info.get("medication", "") or ""
    severity = collected_info.get("severity", "") or ""
    
    all_text = f"{symptom} {additional}".lower()
    
    # Check 1: Emergency keywords
    is_emergency, emergency_keywords = check_emergency_keywords(all_text)
    if is_emergency:
        results["passed"] = False
        results["emergency_alert"] = True
        results["errors"].append(f"🚨 EMERGENCY: {', '.join(emergency_keywords)}")
        results["checks"].append({
            "rule": "emergency_keywords",
            "passed": False,
            "details": f"Emergency keywords detected: {', '.join(emergency_keywords)}",
            "severity": "critical"
        })
    else:
        results["checks"].append({
            "rule": "emergency_keywords",
            "passed": True,
            "details": "No emergency keywords detected",
            "severity": "info"
        })
    
    # Check 2: High priority keywords
    is_high_priority, high_keywords = check_high_priority_keywords(all_text)
    if is_high_priority and not is_emergency:
        results["warnings"].append(f"⚠️ HIGH PRIORITY: {', '.join(high_keywords)}")
        results["checks"].append({
            "rule": "high_priority_keywords",
            "passed": True,
            "details": f"High priority keywords detected: {', '.join(high_keywords)}",
            "severity": "warning"
        })
    else:
        results["checks"].append({
            "rule": "high_priority_keywords",
            "passed": True,
            "details": "No high priority keywords detected",
            "severity": "info"
        })
    
    # Check 3: Severity validation
    if severity:
        if "severe" in severity.lower() and triage_info:
            triage_level = triage_info.get("level", 4)
            if triage_level > 2:
                results["warnings"].append("⚠️ Severe symptom but low triage priority - possible mismatch")
                results["checks"].append({
                    "rule": "severity_triage_mismatch",
                    "passed": False,
                    "details": f"Severe severity but triage level {triage_level}",
                    "severity": "warning"
                })
            else:
                results["checks"].append({
                    "rule": "severity_triage_mismatch",
                    "passed": True,
                    "details": f"Severity matches triage level {triage_level}",
                    "severity": "info"
                })
    
    # Check 4: Medication safety
    if medication and medication != "None" and medication != "Not collected":
        med_check = check_medication_safety(medication)
        if med_check.get("warnings"):
            for warning in med_check.get("warnings", []):
                results["warnings"].append(f"💊 {warning}")
            results["checks"].append({
                "rule": "medication_safety",
                "passed": True,
                "details": f"Medication: {medication} - {', '.join(med_check.get('warnings', []))}",
                "severity": "warning"
            })
    
    # Check 5: Data completeness
    required_fields = ["symptom", "onset", "severity", "location"]
    missing_fields = []
    for field in required_fields:
        if not collected_info.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        results["warnings"].append(f"⚠️ Missing fields: {', '.join(missing_fields)}")
        results["checks"].append({
            "rule": "data_completeness",
            "passed": False,
            "details": f"Missing required fields: {', '.join(missing_fields)}",
            "severity": "warning"
        })
    else:
        results["checks"].append({
            "rule": "data_completeness",
            "passed": True,
            "details": "All required fields present",
            "severity": "info"
        })
    
    # Summary
    print(f"🛡️ SAFETY: {len(results['checks'])} checks performed")
    print(f"   ✅ Passed: {sum(1 for c in results['checks'] if c['passed'])}")
    print(f"   ❌ Failed: {sum(1 for c in results['checks'] if not c['passed'])}")
    
    if results["emergency_alert"]:
        print("   🚨 EMERGENCY ALERT TRIGGERED")
    
    return results


def process_patient_for_safety(patient_id: str, collected_info: dict, triage_info: dict = None) -> dict:
    """
    Process a patient through SAFETY to validate clinical safety.
    """
    
    print("\n" + "=" * 70)
    print(f"🛡️ SAFETY PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ SAFETY: Missing patient ID")
        return None
    
    if not collected_info:
        print("❌ SAFETY: No collected_info provided")
        return None
    
    # Run safety validation
    results = validate_patient_data(collected_info, triage_info)
    
    # Add patient_id
    results["patient_id"] = patient_id
    results["timestamp"] = datetime.now().isoformat()
    
    return results