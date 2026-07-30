"""
AUDIT - Observability & Audit Trail (Agent 8)
Full traceability and system observability
"""

from datetime import datetime


def log_agent_action(patient_id: str, agent: str, action: str, details: str = None, status: str = "success"):
    """
    Log an agent action to the audit system.
    This is a wrapper around the database log_audit_event function.
    """
    from database import log_audit_event
    
    print(f"📝 AUDIT: {agent} → {action}")
    
    try:
        log_audit_event(patient_id, agent, action, details, status)
        return True
    except Exception as e:
        print(f"❌ AUDIT ERROR: {e}")
        return False


def process_patient_for_audit(patient_id: str, action: str, agent: str, details: dict = None, status: str = "success"):
    """
    Process a patient through AUDIT to log their journey.
    """
    
    print("\n" + "=" * 70)
    print(f"📊 AUDIT PROCESSING PATIENT: {patient_id}")
    print("=" * 70)
    
    if not patient_id:
        print("❌ AUDIT: Missing patient ID")
        return None
    
    # Convert details dict to string
    details_str = None
    if details:
        import json
        details_str = json.dumps(details, ensure_ascii=False)
    
    # Log the event
    success = log_agent_action(patient_id, agent, action, details_str, status)
    
    if success:
        print(f"✅ AUDIT: Event logged successfully for patient {patient_id}")
    else:
        print(f"❌ AUDIT: Failed to log event for patient {patient_id}")
    
    return {
        "patient_id": patient_id,
        "agent": agent,
        "action": action,
        "status": status,
        "logged": success
    }