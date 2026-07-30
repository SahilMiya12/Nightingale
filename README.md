🏥 NIGHTINGALE - Multi-Agent Healthcare System


📋 Overview


NIGHTINGALE is a multi-agent healthcare system with 10 specialized AI agents working together for automated patient intake, triage, clinical analysis, scheduling, pharmacy, and follow-up.

🤖 The 10 Agents


#	Agent	Role
1	AURA	Voice/Text patient intake, symptom collection


2	SENTINEL	Emergency triage, priority assignment


3	CLARITY	Auto-generates clinical summaries


4	NEXUS	Stores all patient medical records


5	ORBIT	Appointment booking, resource management


6	MEDIX	Prescription validation, drug interactions


7	CARELINK	Patient follow-up, reminders, monitoring


8	DOCTOR	Assists doctors with patient data


9	SAFETY	Emergency detection, safety monitoring


10	AUDIT	Tracks all system activities, compliance logging


🛠️ Tech Stack


Layer	Technology


Backend	FastAPI, Python, SQLite, DeepSeek
Frontend	React, TypeScript, Web Speech API


🚀 Quick Start


bash

# Backend
cd backend

python3 -m venv myenv

source myenv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000



# Frontend

cd frontend

npm install

npm start

Access

Frontend: http://localhost:3000

API: http://localhost:8000

API Docs: http://localhost:8000/docs


📡 Main API Endpoints


Endpoint	Method	Description


/aura/process	POST	Process patient input

/api/clarity/patients	GET	List patients

/api/clarity/summaries	GET	Get summaries

/api/clarity/stats	GET	Get statistics

/api/dashboard/sentinel	GET	Get triage data

/health	GET	Health check



🔄 Patient Journey

text

Patient → AURA → SENTINEL → CLARITY → NEXUS → ORBIT → MEDIX → CARELINK


🗄️ Database Tables

Table	Stores

patients	Patient information

conversations	Chat history

collected_info	Symptoms

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


📝 License
MIT License


🏥 Built for Healthcare. Powered by AI.

