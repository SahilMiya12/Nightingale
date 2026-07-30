import sqlite3
from datetime import datetime
from functools import wraps
from pathlib import Path
import time


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Always use the database inside the backend directory
DB_PATH = BASE_DIR / "nightingale.db"

DB_TIMEOUT = 30.0
DB_BUSY_TIMEOUT = 30000

MAX_RETRIES = 5
RETRY_BASE_DELAY = 0.5


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():
    """
    Create a SQLite connection.

    IMPORTANT:
    WAL mode is NOT enabled here.
    WAL mode is configured once in init_database().
    """

    DB_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=DB_TIMEOUT,
        check_same_thread=False
    )

    conn.execute(
        f"PRAGMA busy_timeout = {DB_BUSY_TIMEOUT}"
    )

    conn.execute(
        "PRAGMA synchronous = NORMAL"
    )

    conn.execute(
        "PRAGMA foreign_keys = ON"
    )

    return conn


# ============================================================
# RETRY DECORATOR
# ============================================================

def with_retry(func):

    @wraps(func)
    def wrapper(*args, **kwargs):

        for attempt in range(MAX_RETRIES):

            try:

                return func(
                    *args,
                    **kwargs
                )

            except sqlite3.OperationalError as e:

                error_message = str(e).lower()

                if "database is locked" not in error_message:
                    raise

                if attempt == MAX_RETRIES - 1:

                    print(
                        "❌ Database remained locked "
                        f"after {MAX_RETRIES} attempts."
                    )

                    raise

                wait_time = (
                    RETRY_BASE_DELAY *
                    (attempt + 1)
                )

                print(
                    f"⚠️ Database locked. "
                    f"Retrying in {wait_time:.1f}s... "
                    f"(attempt {attempt + 1}/{MAX_RETRIES})"
                )

                time.sleep(wait_time)

        return None

    return wrapper


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

@with_retry
def init_database():

    print(
        "🔧 Initializing database..."
    )

    print(
        f"📁 Database: {DB_PATH}"
    )

    conn = None

    try:

        # ----------------------------------------------------
        # OPEN CONNECTION
        # ----------------------------------------------------

        conn = get_db_connection()

        # ----------------------------------------------------
        # ENABLE WAL MODE ONCE
        # ----------------------------------------------------

        current_mode = conn.execute(
            "PRAGMA journal_mode"
        ).fetchone()[0]

        print(
            f"📌 Current journal mode: {current_mode}"
        )

        if str(current_mode).lower() != "wal":

            print(
                "🔄 Enabling WAL mode..."
            )

            new_mode = conn.execute(
                "PRAGMA journal_mode = WAL"
            ).fetchone()[0]

            print(
                f"✅ Journal mode changed to: {new_mode}"
            )

        # ----------------------------------------------------
        # CREATE TABLES
        # ----------------------------------------------------

        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                patient_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS collected_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                symptom TEXT,
                onset TEXT,
                severity TEXT,
                location TEXT,
                additional TEXT,
                medication TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS triage_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                priority TEXT,
                level INTEGER,
                reason TEXT,
                recommendation TEXT,
                department TEXT,
                symptom TEXT,
                severity TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clarity_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                clinical_summary TEXT,
                symptom_analysis TEXT,
                missing_info TEXT,
                doctor_notes TEXT,
                recommendations TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nexus_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                unified_record TEXT,
                medical_history TEXT,
                allergies TEXT,
                chronic_conditions TEXT,
                past_surgeries TEXT,
                family_history TEXT,
                lifestyle_factors TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orbit_appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                appointment_date TEXT,
                appointment_time TEXT,
                doctor_name TEXT,
                department TEXT,
                urgency TEXT,
                status TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS medix_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                symptom TEXT,
                severity TEXT,
                triage_level INTEGER,
                medication_name TEXT,
                dosage TEXT,
                home_remedy TEXT,
                warning TEXT,
                is_emergency BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS carelink_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                care_type TEXT,
                medication_name TEXT,
                dosage TEXT,
                frequency_hours INTEGER,
                duration_days INTEGER,
                water_reminder BOOLEAN DEFAULT 1,
                rest_reminder BOOLEAN DEFAULT 1,
                check_in_questions TEXT,
                status TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT,
                agent TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                status TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE SET NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS safety_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                rule_name TEXT NOT NULL,
                rule_check TEXT,
                passed BOOLEAN DEFAULT 1,
                severity TEXT,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        # NEW: DOCTOR REVIEWS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS doctor_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT NOT NULL,
                triage_level INTEGER,
                triage_priority TEXT,
                symptom TEXT,
                severity TEXT,
                review_status TEXT,
                doctor_notes TEXT,
                action_taken TEXT,
                reviewed_by TEXT,
                reviewed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (patient_id)
                    REFERENCES patients(patient_id)
                    ON DELETE CASCADE
            )
        """)

        # ----------------------------------------------------
        # INDEXES
        # ----------------------------------------------------

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_conversations_patient_id
            ON conversations(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_collected_info_patient_id
            ON collected_info(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_triage_results_patient_id
            ON triage_results(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_clarity_summaries_patient_id
            ON clarity_summaries(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_nexus_records_patient_id
            ON nexus_records(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_orbit_appointments_patient_id
            ON orbit_appointments(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_medix_suggestions_patient_id
            ON medix_suggestions(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_carelink_plans_patient_id
            ON carelink_plans(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_audit_logs_patient_id
            ON audit_logs(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_audit_logs_agent
            ON audit_logs(agent)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_audit_logs_timestamp
            ON audit_logs(timestamp)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_safety_logs_patient_id
            ON safety_logs(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_safety_logs_created_at
            ON safety_logs(created_at)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_doctor_reviews_patient_id
            ON doctor_reviews(patient_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_doctor_reviews_status
            ON doctor_reviews(review_status)
        """)

        conn.commit()

        print(
            "✅ Database initialized successfully"
        )

    except Exception:

        if conn:

            conn.rollback()

        raise

    finally:

        if conn:

            conn.close()


# ============================================================
# PATIENT
# ============================================================

@with_retry
def get_patient(patient_id: str):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )

        patient = cursor.fetchone()

        if not patient:

            now = datetime.now().isoformat()

            cursor.execute(
                """
                INSERT INTO patients
                (
                    patient_id,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?)
                """,
                (
                    patient_id,
                    now,
                    now
                )
            )

            conn.commit()

        return patient_id

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


# ============================================================
# CONVERSATIONS
# ============================================================

@with_retry
def save_conversation(
    patient_id: str,
    role: str,
    message: str
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        now = datetime.now().isoformat()

        cursor.execute(
            """
            INSERT INTO conversations
            (
                patient_id,
                role,
                message,
                timestamp
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                patient_id,
                role,
                message,
                now
            )
        )

        cursor.execute(
            """
            UPDATE patients
            SET updated_at = ?
            WHERE patient_id = ?
            """,
            (
                now,
                patient_id
            )
        )

        conn.commit()

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


@with_retry
def get_conversation_history(
    patient_id: str,
    limit: int = None
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        if limit:

            cursor.execute(
                """
                SELECT role, message
                FROM
                (
                    SELECT
                        id,
                        role,
                        message
                    FROM conversations
                    WHERE patient_id = ?
                    ORDER BY id DESC
                    LIMIT ?
                )
                ORDER BY id ASC
                """,
                (
                    patient_id,
                    limit
                )
            )

        else:

            cursor.execute(
                """
                SELECT
                    role,
                    message
                FROM conversations
                WHERE patient_id = ?
                ORDER BY id ASC
                """,
                (patient_id,)
            )

        rows = cursor.fetchall()

        return [
            {
                "role": row[0],
                "message": row[1]
            }
            for row in rows
        ]

    finally:

        conn.close()


# ============================================================
# COLLECTED INFORMATION
# ============================================================

@with_retry
def save_collected_info(
    patient_id: str,
    slots: dict
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO collected_info
            (
                patient_id,
                symptom,
                onset,
                severity,
                location,
                additional,
                medication,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                slots.get("symptom"),
                slots.get("onset"),
                slots.get("severity"),
                slots.get("location"),
                slots.get("additional"),
                slots.get("medication"),
                datetime.now().isoformat()
            )
        )

        conn.commit()

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


@with_retry
def get_patient_info(
    patient_id: str
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                symptom,
                onset,
                severity,
                location,
                additional,
                medication
            FROM collected_info
            WHERE patient_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (patient_id,)
        )

        row = cursor.fetchone()

        if not row:

            return None

        return {
            "symptom": row[0],
            "onset": row[1],
            "severity": row[2],
            "location": row[3],
            "additional": row[4],
            "medication": row[5]
        }

    finally:

        conn.close()


# ============================================================
# PATIENT LIST
# ============================================================

@with_retry
def list_all_patients():

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                patient_id,
                created_at,
                updated_at
            FROM patients
            ORDER BY created_at DESC
            """
        )

        rows = cursor.fetchall()

        return [
            {
                "patient_id": row[0],
                "created_at": row[1],
                "updated_at": row[2]
            }
            for row in rows
        ]

    finally:

        conn.close()


# ============================================================
# CLEAR DATA
# ============================================================

@with_retry
def clear_all_data():

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM conversations"
        )

        cursor.execute(
            "DELETE FROM collected_info"
        )

        cursor.execute(
            "DELETE FROM triage_results"
        )

        cursor.execute(
            "DELETE FROM clarity_summaries"
        )

        cursor.execute(
            "DELETE FROM nexus_records"
        )

        cursor.execute(
            "DELETE FROM orbit_appointments"
        )

        cursor.execute(
            "DELETE FROM medix_suggestions"
        )

        cursor.execute(
            "DELETE FROM carelink_plans"
        )

        cursor.execute(
            "DELETE FROM audit_logs"
        )

        cursor.execute(
            "DELETE FROM safety_logs"
        )

        cursor.execute(
            "DELETE FROM doctor_reviews"
        )

        cursor.execute(
            "DELETE FROM patients"
        )

        conn.commit()

        print(
            "🗑️ All database data cleared"
        )

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


# ============================================================
# TRIAGE
# ============================================================

@with_retry
def save_triage_result(
    patient_id: str,
    triage_data: dict,
    collected_info: dict = None
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id
            FROM triage_results
            WHERE patient_id = ?
            """,
            (patient_id,)
        )

        existing = cursor.fetchone()

        symptom = (
            collected_info.get("symptom")
            if collected_info
            else None
        )

        severity = (
            collected_info.get("severity")
            if collected_info
            else None
        )

        values = (
            triage_data.get(
                "priority",
                "UNKNOWN"
            ),
            triage_data.get(
                "level",
                4
            ),
            triage_data.get(
                "reason",
                ""
            ),
            triage_data.get(
                "recommendation",
                ""
            ),
            triage_data.get(
                "department",
                "General Medicine"
            ),
            symptom,
            severity,
            datetime.now().isoformat()
        )

        if existing:

            cursor.execute(
                """
                UPDATE triage_results
                SET
                    priority = ?,
                    level = ?,
                    reason = ?,
                    recommendation = ?,
                    department = ?,
                    symptom = ?,
                    severity = ?,
                    created_at = ?
                WHERE patient_id = ?
                """,
                values + (patient_id,)
            )

        else:

            cursor.execute(
                """
                INSERT INTO triage_results
                (
                    patient_id,
                    priority,
                    level,
                    reason,
                    recommendation,
                    department,
                    symptom,
                    severity,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (patient_id,) + values
            )

        conn.commit()

        print(
            f"✅ Triage saved for patient: {patient_id}"
        )

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


# ============================================================
# TRIAGE STATS
# ============================================================

@with_retry
def get_triage_stats():

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM triage_results
            """
        )

        total = (
            cursor.fetchone()[0]
            or 0
        )

        cursor.execute(
            """
            SELECT
                level,
                COUNT(*)
            FROM triage_results
            GROUP BY level
            """
        )

        level_counts = cursor.fetchall()

        distribution = {
            "Emergency": 0,
            "High": 0,
            "Routine": 0,
            "Information": 0
        }

        for level, count in level_counts:

            if level == 1:

                distribution[
                    "Emergency"
                ] = count

            elif level == 2:

                distribution[
                    "High"
                ] = count

            elif level == 3:

                distribution[
                    "Routine"
                ] = count

            else:

                distribution[
                    "Information"
                ] = count

        cursor.execute(
            """
            SELECT
                patient_id,
                priority,
                level,
                reason,
                department,
                symptom,
                created_at
            FROM triage_results
            ORDER BY id DESC
            LIMIT 10
            """
        )

        recent = cursor.fetchall()

        recent_list = []

        for row in recent:

            patient_id = row[0] or "Unknown"

            display_id = (
                patient_id[:12] + "..."
                if len(patient_id) > 12
                else patient_id
            )

            recent_list.append(
                {
                    "patient_id":
                        display_id,

                    "priority":
                        row[1] or "Unknown",

                    "level":
                        row[2] or 4,

                    "reason":
                        row[3] or "",

                    "department":
                        row[4]
                        or "General Medicine",

                    "symptom":
                        row[5]
                        or "Unknown",

                    "created_at":
                        row[6] or ""
                }
            )

        return {
            "total": total,
            "distribution": distribution,
            "recent": recent_list
        }

    finally:

        conn.close()


# ============================================================
# CLARITY SUMMARY
# ============================================================

@with_retry
def save_clarity_summary(
    patient_id: str,
    summary_data: dict
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id
            FROM clarity_summaries
            WHERE patient_id = ?
            """,
            (patient_id,)
        )

        existing = cursor.fetchone()

        values = (
            summary_data.get(
                "clinical_summary",
                ""
            ),
            summary_data.get(
                "symptom_analysis",
                ""
            ),
            summary_data.get(
                "missing_info",
                ""
            ),
            summary_data.get(
                "doctor_notes",
                ""
            ),
            summary_data.get(
                "recommendations",
                ""
            ),
            datetime.now().isoformat()
        )

        if existing:

            cursor.execute(
                """
                UPDATE clarity_summaries
                SET
                    clinical_summary = ?,
                    symptom_analysis = ?,
                    missing_info = ?,
                    doctor_notes = ?,
                    recommendations = ?,
                    created_at = ?
                WHERE patient_id = ?
                """,
                values + (patient_id,)
            )

        else:

            cursor.execute(
                """
                INSERT INTO clarity_summaries
                (
                    patient_id,
                    clinical_summary,
                    symptom_analysis,
                    missing_info,
                    doctor_notes,
                    recommendations,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (patient_id,) + values
            )

        conn.commit()

        print(
            f"✅ CLARITY summary saved "
            f"for patient: {patient_id}"
        )

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


@with_retry
def get_clarity_summaries(
    patient_id: str = None
):

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        if patient_id:

            cursor.execute(
                """
                SELECT
                    id,
                    patient_id,
                    clinical_summary,
                    symptom_analysis,
                    missing_info,
                    doctor_notes,
                    recommendations,
                    created_at
                FROM clarity_summaries
                WHERE patient_id = ?
                ORDER BY id DESC
                """,
                (patient_id,)
            )

        else:

            cursor.execute(
                """
                SELECT
                    id,
                    patient_id,
                    clinical_summary,
                    symptom_analysis,
                    missing_info,
                    doctor_notes,
                    recommendations,
                    created_at
                FROM clarity_summaries
                ORDER BY id DESC
                """
            )

        rows = cursor.fetchall()

        return [
            {
                "id": row[0],
                "patient_id": row[1],
                "clinical_summary": row[2],
                "symptom_analysis": row[3],
                "missing_info": row[4],
                "doctor_notes": row[5],
                "recommendations": row[6],
                "created_at": row[7]
            }
            for row in rows
        ]

    finally:

        conn.close()


# ============================================================
# NEXUS - UNIFIED PATIENT RECORDS
# ============================================================

@with_retry
def save_nexus_record(patient_id: str, record_data: dict):
    """
    Save or update a NEXUS unified patient record.
    One record per patient.
    """
    
    print("\n" + "=" * 60)
    print("💾 NEXUS DATABASE SAVE")
    print("=" * 60)
    
    print(f"Patient ID: {patient_id}")
    
    if not patient_id:
        print("❌ NEXUS DB: patient_id is empty")
        return False
    
    if not record_data:
        print("❌ NEXUS DB: record_data is empty")
        return False
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Make sure patient exists
        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        patient_exists = cursor.fetchone()
        
        if not patient_exists:
            print(f"⚠️ NEXUS DB: Patient {patient_id} does not exist. Creating...")
            now = datetime.now().isoformat()
            cursor.execute(
                """
                INSERT INTO patients
                (patient_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (patient_id, now, now)
            )
        
        now = datetime.now().isoformat()
        
        # Extract fields
        unified_record = str(record_data.get("unified_record", "") or "")
        medical_history = str(record_data.get("medical_history", "") or "")
        allergies = str(record_data.get("allergies", "") or "")
        chronic_conditions = str(record_data.get("chronic_conditions", "") or "")
        past_surgeries = str(record_data.get("past_surgeries", "") or "")
        family_history = str(record_data.get("family_history", "") or "")
        lifestyle_factors = str(record_data.get("lifestyle_factors", "") or "")
        
        # Check existing record
        cursor.execute(
            """
            SELECT id
            FROM nexus_records
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        existing = cursor.fetchone()
        
        if existing:
            print(f"🔄 Updating existing NEXUS record for patient {patient_id}")
            cursor.execute(
                """
                UPDATE nexus_records
                SET
                    unified_record = ?,
                    medical_history = ?,
                    allergies = ?,
                    chronic_conditions = ?,
                    past_surgeries = ?,
                    family_history = ?,
                    lifestyle_factors = ?,
                    updated_at = ?
                WHERE patient_id = ?
                """,
                (
                    unified_record,
                    medical_history,
                    allergies,
                    chronic_conditions,
                    past_surgeries,
                    family_history,
                    lifestyle_factors,
                    now,
                    patient_id
                )
            )
        else:
            print(f"➕ Creating new NEXUS record for patient {patient_id}")
            cursor.execute(
                """
                INSERT INTO nexus_records
                (
                    patient_id,
                    unified_record,
                    medical_history,
                    allergies,
                    chronic_conditions,
                    past_surgeries,
                    family_history,
                    lifestyle_factors,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    unified_record,
                    medical_history,
                    allergies,
                    chronic_conditions,
                    past_surgeries,
                    family_history,
                    lifestyle_factors,
                    now,
                    now
                )
            )
        
        conn.commit()
        
        print(f"✅ NEXUS record saved for patient: {patient_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ NEXUS DATABASE ERROR: {type(e).__name__}: {e}")
        raise
        
    finally:
        if conn:
            conn.close()


@with_retry
def get_nexus_record(patient_id: str):
    """Get NEXUS record for a patient"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                unified_record,
                medical_history,
                allergies,
                chronic_conditions,
                past_surgeries,
                family_history,
                lifestyle_factors,
                created_at,
                updated_at
            FROM nexus_records
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "patient_id": row[1],
            "unified_record": row[2],
            "medical_history": row[3],
            "allergies": row[4],
            "chronic_conditions": row[5],
            "past_surgeries": row[6],
            "family_history": row[7],
            "lifestyle_factors": row[8],
            "created_at": row[9],
            "updated_at": row[10]
        }
        
    finally:
        conn.close()


@with_retry
def get_all_nexus_records(limit: int = 50):
    """Get all NEXUS records"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                unified_record,
                medical_history,
                allergies,
                chronic_conditions,
                past_surgeries,
                family_history,
                lifestyle_factors,
                created_at,
                updated_at
            FROM nexus_records
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        
        rows = cursor.fetchall()
        
        records = []
        for row in rows:
            records.append({
                "id": row[0],
                "patient_id": row[1],
                "unified_record": row[2],
                "medical_history": row[3],
                "allergies": row[4],
                "chronic_conditions": row[5],
                "past_surgeries": row[6],
                "family_history": row[7],
                "lifestyle_factors": row[8],
                "created_at": row[9],
                "updated_at": row[10]
            })
        
        return records
        
    finally:
        conn.close()


# ============================================================
# ORBIT - APPOINTMENT SCHEDULING
# ============================================================

@with_retry
def save_orbit_appointment(patient_id: str, appointment_data: dict):
    """
    Save or update an ORBIT appointment.
    One appointment per patient.
    """
    
    print("\n" + "=" * 60)
    print("📅 ORBIT DATABASE SAVE")
    print("=" * 60)
    
    print(f"Patient ID: {patient_id}")
    
    if not patient_id:
        print("❌ ORBIT DB: patient_id is empty")
        return False
    
    if not appointment_data:
        print("❌ ORBIT DB: appointment_data is empty")
        return False
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Make sure patient exists
        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        patient_exists = cursor.fetchone()
        
        if not patient_exists:
            print(f"⚠️ ORBIT DB: Patient {patient_id} does not exist. Creating...")
            now = datetime.now().isoformat()
            cursor.execute(
                """
                INSERT INTO patients
                (patient_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (patient_id, now, now)
            )
        
        now = datetime.now().isoformat()
        
        # Extract fields
        appointment_date = str(appointment_data.get("appointment_date", "") or "")
        appointment_time = str(appointment_data.get("appointment_time", "") or "")
        doctor_name = str(appointment_data.get("doctor_name", "") or "")
        department = str(appointment_data.get("department", "") or "")
        urgency = str(appointment_data.get("urgency", "") or "")
        status = str(appointment_data.get("status", "scheduled") or "scheduled")
        notes = str(appointment_data.get("notes", "") or "")
        
        # Check existing appointment
        cursor.execute(
            """
            SELECT id
            FROM orbit_appointments
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        existing = cursor.fetchone()
        
        if existing:
            print(f"🔄 Updating existing appointment for patient {patient_id}")
            cursor.execute(
                """
                UPDATE orbit_appointments
                SET
                    appointment_date = ?,
                    appointment_time = ?,
                    doctor_name = ?,
                    department = ?,
                    urgency = ?,
                    status = ?,
                    notes = ?,
                    updated_at = ?
                WHERE patient_id = ?
                """,
                (
                    appointment_date,
                    appointment_time,
                    doctor_name,
                    department,
                    urgency,
                    status,
                    notes,
                    now,
                    patient_id
                )
            )
        else:
            print(f"➕ Creating new appointment for patient {patient_id}")
            cursor.execute(
                """
                INSERT INTO orbit_appointments
                (
                    patient_id,
                    appointment_date,
                    appointment_time,
                    doctor_name,
                    department,
                    urgency,
                    status,
                    notes,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    appointment_date,
                    appointment_time,
                    doctor_name,
                    department,
                    urgency,
                    status,
                    notes,
                    now,
                    now
                )
            )
        
        conn.commit()
        
        print(f"✅ ORBIT appointment saved for patient: {patient_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ ORBIT DATABASE ERROR: {type(e).__name__}: {e}")
        raise
        
    finally:
        if conn:
            conn.close()


@with_retry
def get_orbit_appointment(patient_id: str):
    """Get ORBIT appointment for a patient"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                appointment_date,
                appointment_time,
                doctor_name,
                department,
                urgency,
                status,
                notes,
                created_at,
                updated_at
            FROM orbit_appointments
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "patient_id": row[1],
            "appointment_date": row[2],
            "appointment_time": row[3],
            "doctor_name": row[4],
            "department": row[5],
            "urgency": row[6],
            "status": row[7],
            "notes": row[8],
            "created_at": row[9],
            "updated_at": row[10]
        }
        
    finally:
        conn.close()


@with_retry
def get_all_orbit_appointments(limit: int = 50):
    """Get all ORBIT appointments"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                appointment_date,
                appointment_time,
                doctor_name,
                department,
                urgency,
                status,
                notes,
                created_at,
                updated_at
            FROM orbit_appointments
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        
        rows = cursor.fetchall()
        
        appointments = []
        for row in rows:
            appointments.append({
                "id": row[0],
                "patient_id": row[1],
                "appointment_date": row[2],
                "appointment_time": row[3],
                "doctor_name": row[4],
                "department": row[5],
                "urgency": row[6],
                "status": row[7],
                "notes": row[8],
                "created_at": row[9],
                "updated_at": row[10]
            })
        
        return appointments
        
    finally:
        conn.close()


# ============================================================
# MEDIX - MEDICATION & HOME REMEDY SUGGESTIONS
# ============================================================

@with_retry
def save_medix_suggestion(patient_id: str, suggestion_data: dict):
    """
    Save MEDIX suggestion for a patient.
    """
    
    print("\n" + "=" * 60)
    print("💊 MEDIX DATABASE SAVE")
    print("=" * 60)
    
    print(f"Patient ID: {patient_id}")
    
    if not patient_id:
        print("❌ MEDIX DB: patient_id is empty")
        return False
    
    if not suggestion_data:
        print("❌ MEDIX DB: suggestion_data is empty")
        return False
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Make sure patient exists
        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        patient_exists = cursor.fetchone()
        
        if not patient_exists:
            print(f"⚠️ MEDIX DB: Patient {patient_id} does not exist. Creating...")
            now = datetime.now().isoformat()
            cursor.execute(
                """
                INSERT INTO patients
                (patient_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (patient_id, now, now)
            )
        
        now = datetime.now().isoformat()
        
        # Extract fields
        symptom = str(suggestion_data.get("symptom", "") or "")
        severity = str(suggestion_data.get("severity", "") or "")
        triage_level = suggestion_data.get("triage_level", 4)
        medication_name = str(suggestion_data.get("medication_name", "") or "")
        dosage = str(suggestion_data.get("dosage", "") or "")
        home_remedy = str(suggestion_data.get("home_remedy", "") or "")
        warning = str(suggestion_data.get("warning", "") or "")
        is_emergency = 1 if suggestion_data.get("is_emergency", False) else 0
        
        # Check existing suggestion
        cursor.execute(
            """
            SELECT id
            FROM medix_suggestions
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        existing = cursor.fetchone()
        
        if existing:
            print(f"🔄 Updating existing MEDIX suggestion for patient {patient_id}")
            cursor.execute(
                """
                UPDATE medix_suggestions
                SET
                    symptom = ?,
                    severity = ?,
                    triage_level = ?,
                    medication_name = ?,
                    dosage = ?,
                    home_remedy = ?,
                    warning = ?,
                    is_emergency = ?,
                    created_at = ?
                WHERE patient_id = ?
                """,
                (
                    symptom,
                    severity,
                    triage_level,
                    medication_name,
                    dosage,
                    home_remedy,
                    warning,
                    is_emergency,
                    now,
                    patient_id
                )
            )
        else:
            print(f"➕ Creating new MEDIX suggestion for patient {patient_id}")
            cursor.execute(
                """
                INSERT INTO medix_suggestions
                (
                    patient_id,
                    symptom,
                    severity,
                    triage_level,
                    medication_name,
                    dosage,
                    home_remedy,
                    warning,
                    is_emergency,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    symptom,
                    severity,
                    triage_level,
                    medication_name,
                    dosage,
                    home_remedy,
                    warning,
                    is_emergency,
                    now
                )
            )
        
        conn.commit()
        
        print(f"✅ MEDIX suggestion saved for patient: {patient_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ MEDIX DATABASE ERROR: {type(e).__name__}: {e}")
        raise
        
    finally:
        if conn:
            conn.close()


@with_retry
def get_medix_suggestion(patient_id: str):
    """Get MEDIX suggestion for a patient"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                symptom,
                severity,
                triage_level,
                medication_name,
                dosage,
                home_remedy,
                warning,
                is_emergency,
                created_at
            FROM medix_suggestions
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "patient_id": row[1],
            "symptom": row[2],
            "severity": row[3],
            "triage_level": row[4],
            "medication_name": row[5],
            "dosage": row[6],
            "home_remedy": row[7],
            "warning": row[8],
            "is_emergency": bool(row[9]),
            "created_at": row[10]
        }
        
    finally:
        conn.close()


@with_retry
def get_all_medix_suggestions(limit: int = 50):
    """Get all MEDIX suggestions"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                symptom,
                severity,
                triage_level,
                medication_name,
                dosage,
                home_remedy,
                warning,
                is_emergency,
                created_at
            FROM medix_suggestions
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        
        rows = cursor.fetchall()
        
        suggestions = []
        for row in rows:
            suggestions.append({
                "id": row[0],
                "patient_id": row[1],
                "symptom": row[2],
                "severity": row[3],
                "triage_level": row[4],
                "medication_name": row[5],
                "dosage": row[6],
                "home_remedy": row[7],
                "warning": row[8],
                "is_emergency": bool(row[9]),
                "created_at": row[10]
            })
        
        return suggestions
        
    finally:
        conn.close()


# ============================================================
# CARELINK - CARE PLANS
# ============================================================

@with_retry
def save_carelink_plan(patient_id: str, plan_data: dict):
    """
    Save or update a CARELINK care plan.
    One plan per patient.
    """
    
    print("\n" + "=" * 60)
    print("❤️ CARELINK DATABASE SAVE")
    print("=" * 60)
    
    print(f"Patient ID: {patient_id}")
    
    if not patient_id:
        print("❌ CARELINK DB: patient_id is empty")
        return False
    
    if not plan_data:
        print("❌ CARELINK DB: plan_data is empty")
        return False
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Make sure patient exists
        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        patient_exists = cursor.fetchone()
        
        if not patient_exists:
            print(f"⚠️ CARELINK DB: Patient {patient_id} does not exist. Creating...")
            now = datetime.now().isoformat()
            cursor.execute(
                """
                INSERT INTO patients
                (patient_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (patient_id, now, now)
            )
        
        now = datetime.now().isoformat()
        
        # Extract fields
        care_type = str(plan_data.get("care_type", "") or "")
        medication_name = str(plan_data.get("medication_name", "") or "")
        dosage = str(plan_data.get("dosage", "") or "")
        frequency_hours = plan_data.get("frequency_hours", 6)
        duration_days = plan_data.get("duration_days", 3)
        water_reminder = 1 if plan_data.get("water_reminder", True) else 0
        rest_reminder = 1 if plan_data.get("rest_reminder", True) else 0
        check_in_questions = plan_data.get("check_in_questions", "")
        status = str(plan_data.get("status", "active") or "active")
        
        # Check existing plan
        cursor.execute(
            """
            SELECT id
            FROM carelink_plans
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        existing = cursor.fetchone()
        
        if existing:
            print(f"🔄 Updating existing CARELINK plan for patient {patient_id}")
            cursor.execute(
                """
                UPDATE carelink_plans
                SET
                    care_type = ?,
                    medication_name = ?,
                    dosage = ?,
                    frequency_hours = ?,
                    duration_days = ?,
                    water_reminder = ?,
                    rest_reminder = ?,
                    check_in_questions = ?,
                    status = ?,
                    updated_at = ?
                WHERE patient_id = ?
                """,
                (
                    care_type,
                    medication_name,
                    dosage,
                    frequency_hours,
                    duration_days,
                    water_reminder,
                    rest_reminder,
                    check_in_questions,
                    status,
                    now,
                    patient_id
                )
            )
        else:
            print(f"➕ Creating new CARELINK plan for patient {patient_id}")
            cursor.execute(
                """
                INSERT INTO carelink_plans
                (
                    patient_id,
                    care_type,
                    medication_name,
                    dosage,
                    frequency_hours,
                    duration_days,
                    water_reminder,
                    rest_reminder,
                    check_in_questions,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    care_type,
                    medication_name,
                    dosage,
                    frequency_hours,
                    duration_days,
                    water_reminder,
                    rest_reminder,
                    check_in_questions,
                    status,
                    now,
                    now
                )
            )
        
        conn.commit()
        
        print(f"✅ CARELINK plan saved for patient: {patient_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ CARELINK DATABASE ERROR: {type(e).__name__}: {e}")
        raise
        
    finally:
        if conn:
            conn.close()


@with_retry
def get_carelink_plan(patient_id: str):
    """Get CARELINK plan for a patient"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                care_type,
                medication_name,
                dosage,
                frequency_hours,
                duration_days,
                water_reminder,
                rest_reminder,
                check_in_questions,
                status,
                created_at,
                updated_at
            FROM carelink_plans
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "patient_id": row[1],
            "care_type": row[2],
            "medication_name": row[3],
            "dosage": row[4],
            "frequency_hours": row[5],
            "duration_days": row[6],
            "water_reminder": bool(row[7]),
            "rest_reminder": bool(row[8]),
            "check_in_questions": row[9],
            "status": row[10],
            "created_at": row[11],
            "updated_at": row[12]
        }
        
    finally:
        conn.close()


@with_retry
def get_all_carelink_plans(limit: int = 50):
    """Get all CARELINK plans"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                care_type,
                medication_name,
                dosage,
                frequency_hours,
                duration_days,
                water_reminder,
                rest_reminder,
                check_in_questions,
                status,
                created_at,
                updated_at
            FROM carelink_plans
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        
        rows = cursor.fetchall()
        
        plans = []
        for row in rows:
            plans.append({
                "id": row[0],
                "patient_id": row[1],
                "care_type": row[2],
                "medication_name": row[3],
                "dosage": row[4],
                "frequency_hours": row[5],
                "duration_days": row[6],
                "water_reminder": bool(row[7]),
                "rest_reminder": bool(row[8]),
                "check_in_questions": row[9],
                "status": row[10],
                "created_at": row[11],
                "updated_at": row[12]
            })
        
        return plans
        
    finally:
        conn.close()


# ============================================================
# AUDIT - LOGGING & OBSERVABILITY
# ============================================================

@with_retry
def log_audit_event(patient_id: str, agent: str, action: str, details: str = None, status: str = "success"):
    """
    Log an audit event.
    """
    
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute(
            """
            INSERT INTO audit_logs
            (patient_id, agent, action, details, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                agent,
                action,
                details or "",
                status,
                now
            )
        )
        
        conn.commit()
        print(f"📝 AUDIT: {agent} → {action} (Status: {status})")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ AUDIT ERROR: {e}")
        raise
        
    finally:
        conn.close()


@with_retry
def get_audit_logs(patient_id: str = None, agent: str = None, limit: int = 100):
    """Get audit logs with optional filters"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        query = """
            SELECT
                id,
                patient_id,
                agent,
                action,
                details,
                status,
                timestamp
            FROM audit_logs
            WHERE 1=1
        """
        params = []
        
        if patient_id:
            query += " AND patient_id = ?"
            params.append(patient_id)
        
        if agent:
            query += " AND agent = ?"
            params.append(agent)
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        logs = []
        for row in rows:
            logs.append({
                "id": row[0],
                "patient_id": row[1],
                "agent": row[2],
                "action": row[3],
                "details": row[4],
                "status": row[5],
                "timestamp": row[6]
            })
        
        return logs
        
    finally:
        conn.close()


@with_retry
def get_audit_stats():
    """Get audit statistics"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        # Total logs
        cursor.execute("SELECT COUNT(*) FROM audit_logs")
        total = cursor.fetchone()[0] or 0
        
        # Logs by agent
        cursor.execute("""
            SELECT agent, COUNT(*) 
            FROM audit_logs 
            GROUP BY agent 
            ORDER BY COUNT(*) DESC
        """)
        agent_counts = cursor.fetchall()
        
        # Logs by status
        cursor.execute("""
            SELECT status, COUNT(*) 
            FROM audit_logs 
            GROUP BY status
        """)
        status_counts = cursor.fetchall()
        
        # Today's logs
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute(
            "SELECT COUNT(*) FROM audit_logs WHERE timestamp LIKE ?",
            (today + "%",)
        )
        today_count = cursor.fetchone()[0] or 0
        
        return {
            "total": total,
            "today": today_count,
            "by_agent": dict(agent_counts),
            "by_status": dict(status_counts)
        }
        
    finally:
        conn.close()


# ============================================================
# SAFETY - CLINICAL SAFETY RULES & GUARDRAILS
# ============================================================

@with_retry
def save_safety_log(patient_id: str, rule_name: str, rule_check: str, passed: bool, severity: str = "info", details: str = None):
    """
    Save a safety rule check result.
    """
    
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute(
            """
            INSERT INTO safety_logs
            (patient_id, rule_name, rule_check, passed, severity, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                rule_name,
                rule_check,
                1 if passed else 0,
                severity,
                details or "",
                now
            )
        )
        
        conn.commit()
        
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"🛡️ SAFETY: {rule_name} → {status}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ SAFETY ERROR: {e}")
        raise
        
    finally:
        conn.close()


@with_retry
def get_safety_logs(patient_id: str = None, limit: int = 100):
    """Get safety logs with optional filters"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        query = """
            SELECT
                id,
                patient_id,
                rule_name,
                rule_check,
                passed,
                severity,
                details,
                created_at
            FROM safety_logs
            WHERE 1=1
        """
        params = []
        
        if patient_id:
            query += " AND patient_id = ?"
            params.append(patient_id)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        logs = []
        for row in rows:
            logs.append({
                "id": row[0],
                "patient_id": row[1],
                "rule_name": row[2],
                "rule_check": row[3],
                "passed": bool(row[4]),
                "severity": row[5],
                "details": row[6],
                "created_at": row[7]
            })
        
        return logs
        
    finally:
        conn.close()


@with_retry
def get_safety_stats():
    """Get safety statistics"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        # Total checks
        cursor.execute("SELECT COUNT(*) FROM safety_logs")
        total = cursor.fetchone()[0] or 0
        
        # Passed vs Failed
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as failed
            FROM safety_logs
        """)
        row = cursor.fetchone()
        passed = row[0] or 0
        failed = row[1] or 0
        
        # By severity
        cursor.execute("""
            SELECT severity, COUNT(*) 
            FROM safety_logs 
            GROUP BY severity
        """)
        severity_counts = cursor.fetchall()
        
        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "by_severity": dict(severity_counts)
        }
        
    finally:
        conn.close()


# ============================================================
# DOCTOR - HUMAN-IN-THE-LOOP REVIEW
# ============================================================

@with_retry
def save_doctor_review(patient_id: str, review_data: dict):
    """
    Save or update a DOCTOR review.
    """
    
    print("\n" + "=" * 60)
    print("👨‍⚕️ DOCTOR DATABASE SAVE")
    print("=" * 60)
    
    print(f"Patient ID: {patient_id}")
    
    if not patient_id:
        print("❌ DOCTOR DB: patient_id is empty")
        return False
    
    if not review_data:
        print("❌ DOCTOR DB: review_data is empty")
        return False
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Make sure patient exists
        cursor.execute(
            """
            SELECT patient_id
            FROM patients
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        patient_exists = cursor.fetchone()
        
        if not patient_exists:
            print(f"⚠️ DOCTOR DB: Patient {patient_id} does not exist. Creating...")
            now = datetime.now().isoformat()
            cursor.execute(
                """
                INSERT INTO patients
                (patient_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (patient_id, now, now)
            )
        
        now = datetime.now().isoformat()
        
        # Extract fields
        triage_level = review_data.get("triage_level", 4)
        triage_priority = str(review_data.get("triage_priority", "") or "")
        symptom = str(review_data.get("symptom", "") or "")
        severity = str(review_data.get("severity", "") or "")
        review_status = str(review_data.get("review_status", "pending") or "pending")
        doctor_notes = str(review_data.get("doctor_notes", "") or "")
        action_taken = str(review_data.get("action_taken", "") or "")
        reviewed_by = str(review_data.get("reviewed_by", "") or "")
        reviewed_at = review_data.get("reviewed_at") or None
        
        # Check existing review
        cursor.execute(
            """
            SELECT id
            FROM doctor_reviews
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        existing = cursor.fetchone()
        
        if existing:
            print(f"🔄 Updating existing DOCTOR review for patient {patient_id}")
            cursor.execute(
                """
                UPDATE doctor_reviews
                SET
                    triage_level = ?,
                    triage_priority = ?,
                    symptom = ?,
                    severity = ?,
                    review_status = ?,
                    doctor_notes = ?,
                    action_taken = ?,
                    reviewed_by = ?,
                    reviewed_at = ?,
                    updated_at = ?
                WHERE patient_id = ?
                """,
                (
                    triage_level,
                    triage_priority,
                    symptom,
                    severity,
                    review_status,
                    doctor_notes,
                    action_taken,
                    reviewed_by,
                    reviewed_at,
                    now,
                    patient_id
                )
            )
        else:
            print(f"➕ Creating new DOCTOR review for patient {patient_id}")
            cursor.execute(
                """
                INSERT INTO doctor_reviews
                (
                    patient_id,
                    triage_level,
                    triage_priority,
                    symptom,
                    severity,
                    review_status,
                    doctor_notes,
                    action_taken,
                    reviewed_by,
                    reviewed_at,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    triage_level,
                    triage_priority,
                    symptom,
                    severity,
                    review_status,
                    doctor_notes,
                    action_taken,
                    reviewed_by,
                    reviewed_at,
                    now,
                    now
                )
            )
        
        conn.commit()
        
        print(f"✅ DOCTOR review saved for patient: {patient_id}")
        return True
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ DOCTOR DATABASE ERROR: {type(e).__name__}: {e}")
        raise
        
    finally:
        if conn:
            conn.close()


@with_retry
def get_doctor_review(patient_id: str):
    """Get DOCTOR review for a patient"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                patient_id,
                triage_level,
                triage_priority,
                symptom,
                severity,
                review_status,
                doctor_notes,
                action_taken,
                reviewed_by,
                reviewed_at,
                created_at,
                updated_at
            FROM doctor_reviews
            WHERE patient_id = ?
            """,
            (patient_id,)
        )
        
        row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row[0],
            "patient_id": row[1],
            "triage_level": row[2],
            "triage_priority": row[3],
            "symptom": row[4],
            "severity": row[5],
            "review_status": row[6],
            "doctor_notes": row[7],
            "action_taken": row[8],
            "reviewed_by": row[9],
            "reviewed_at": row[10],
            "created_at": row[11],
            "updated_at": row[12]
        }
        
    finally:
        conn.close()


@with_retry
def get_all_doctor_reviews(limit: int = 50, status: str = None):
    """Get all DOCTOR reviews with optional status filter"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        query = """
            SELECT
                id,
                patient_id,
                triage_level,
                triage_priority,
                symptom,
                severity,
                review_status,
                doctor_notes,
                action_taken,
                reviewed_by,
                reviewed_at,
                created_at,
                updated_at
            FROM doctor_reviews
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND review_status = ?"
            params.append(status)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        reviews = []
        for row in rows:
            reviews.append({
                "id": row[0],
                "patient_id": row[1],
                "triage_level": row[2],
                "triage_priority": row[3],
                "symptom": row[4],
                "severity": row[5],
                "review_status": row[6],
                "doctor_notes": row[7],
                "action_taken": row[8],
                "reviewed_by": row[9],
                "reviewed_at": row[10],
                "created_at": row[11],
                "updated_at": row[12]
            })
        
        return reviews
        
    finally:
        conn.close()


@with_retry
def get_doctor_stats():
    """Get DOCTOR statistics"""
    conn = get_db_connection()
    
    try:
        cursor = conn.cursor()
        
        # Total reviews
        cursor.execute("SELECT COUNT(*) FROM doctor_reviews")
        total = cursor.fetchone()[0] or 0
        
        # By status
        cursor.execute("""
            SELECT review_status, COUNT(*) 
            FROM doctor_reviews 
            GROUP BY review_status
        """)
        status_counts = cursor.fetchall()
        
        # Pending reviews (emergency/high priority)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM doctor_reviews 
            WHERE review_status = 'pending' 
            AND triage_level <= 2
        """)
        pending_emergency = cursor.fetchone()[0] or 0
        
        return {
            "total": total,
            "by_status": dict(status_counts),
            "pending_emergency": pending_emergency
        }
        
    finally:
        conn.close()


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

@with_retry
def check_database():

    conn = get_db_connection()

    try:

        cursor = conn.cursor()

        cursor.execute(
            "SELECT 1"
        )

        return cursor.fetchone() == (1,)

    finally:

        conn.close()


# ============================================================
# MANUAL INITIALIZATION
# ============================================================

if __name__ == "__main__":

    print(
        "🚀 Initializing Nightingale database..."
    )

    print(
        f"📁 Database file: {DB_PATH}"
    )

    init_database()

    print(
        "✅ Database initialization completed"
    )