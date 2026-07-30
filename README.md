NIGHTINGALE - Multi-Agent Healthcare System


🏥 Overview
NIGHTINGALE is a multi-agent healthcare system with 10 specialized AI agents working together for automated patient intake, triage, clinical analysis, scheduling, pharmacy, follow-up, and more.


🤖 The 10 Agents
#	Agent	Full Form	Role
1	AURA	Adaptive Unified Reception Assistant	Voice/Text patient intake, symptom collection
2	SENTINEL	Smart Emergency Navigation & Triage Intelligence Engine	Emergency triage, priority assignment
3	CLARITY	Clinical Learning & AI Reasoning for Intelligent Treatment	Auto-generates clinical summaries
4	NEXUS	Networked Electronic eXchange for Unified Storage	Stores all patient medical records
5	ORBIT	Operational Resource & Booking Intelligence Tracker	Appointment booking, resource management
6	MEDIX	Medical Evaluation & Drug Intelligence Xpert	Prescription validation, drug interactions
7	CARELINK	Continuous Assistance, Recovery & Engagement Link	Patient follow-up, reminders, monitoring
8	DOCTOR	Doctor Assistant Agent	Assists doctors with patient data, diagnosis support
9	SAFETY	Safety & Guardrail Agent	Emergency detection, safety monitoring
10	AUDIT	Audit & Logging Agent	Tracks all system activities, compliance logging


📁 Agent Files Structure
text
agents/
├── __init__.py
├── aura.py          # Voice/Text intake
├── sentinel.py      # Emergency triage
├── clarity.py       # Clinical summaries
├── nexus.py         # Medical records
├── orbit.py         # Scheduling
├── medix.py         # Pharmacy
├── carelink.py      # Follow-up
├── doctor.py        # Doctor assistant
├── safety.py        # Safety guardrails
└── audit.py         # Audit logging


🛠️ Tech Stack
Layer	Technology
Backend	FastAPI, Python 3.10+, SQLite, DeepSeek
Frontend	React 18, TypeScript, CSS, Web Speech API
AI/ML	DeepSeek-R1:1.5B, LangChain


🚀 Quick Start
bash
# Backend
cd backend
python3 -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000


# Frontend
cd frontend
npm install
npm start
Access
Frontend: http://localhost:3000

API: http://localhost:8000

API Docs: http://localhost:8000/docs


📡 Main API Endpoints
Agent	Endpoint	Method	Description
AURA	/aura/process	POST	Process patient input
CLARITY	/api/clarity/patients	GET	List patients
CLARITY	/api/clarity/summaries	GET	Get summaries
CLARITY	/api/clarity/stats	GET	Get statistics
SENTINEL	/api/dashboard/sentinel	GET	Get triage data
Health	/health	GET	System health check


🔄 Patient Journey
text
Patient → AURA → SENTINEL → CLARITY → NEXUS → ORBIT → MEDIX → CARELINK
              ↓          ↓         ↓        ↓        ↓
           Triage    Clinical  Records  Schedule  Pharmacy

           
🗄️ Database Tables
Table	Stores
patients	Patient information
conversations	AURA chat history
collected_info	Extracted symptoms
triage_results	Triage assessments
clarity_summaries	Clinical summaries


🛡️ Safety Features
✅ Emergency keyword detection

✅ No medical advice from AURA

✅ Drug interaction checking

✅ Allergy verification

✅ Multi-language support (6 languages)



Emergency Keywords
text
chest pain, heart attack, stroke, difficulty breathing, 
unconscious, severe bleeding, suicide, overdose


📋 Quick Commands
bash
# Test AURA
curl -X POST http://localhost:8000/aura/process \
  -H "Content-Type: application/json" \
  -d '{"text":"I have a headache","session_id":"test"}'


# Health Check
curl http://localhost:8000/health
