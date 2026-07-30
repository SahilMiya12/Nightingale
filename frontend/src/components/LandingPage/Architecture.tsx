import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ============================================================
   TYPES - ENHANCED WITH NEW STATUSES
============================================================ */

type NodeStatus = 
  | "idle" 
  | "waiting"      // NEW: Waiting for human or condition
  | "processing" 
  | "completed" 
  | "skipped"      // NEW: Not needed for this workflow
  | "escalated"    // NEW: Emergency escalation
  | "error";

type FlowType =
  | "input"
  | "routing"
  | "agent"
  | "database"
  | "external"
  | "success"
  | "escalated"    // NEW: For emergency escalations
  | "waiting";     // NEW: For waiting states

type ScenarioKey =
  | "consultation"
  | "emergency"
  | "appointment"
  | "medication";

type AgentId =
  | "atlas"
  | "aura"
  | "sentinel"
  | "clarity"
  | "nexus"
  | "orbit"
  | "medix"
  | "carelink"
  | "doctor"
  | "safety"       // NEW: Safety & Policy Agent
  | "audit";       // NEW: Audit & Observability

type ArchitectureNode = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  kind:
    | "patient"
    | "frontend"
    | "api"
    | "orchestrator"
    | "agent"
    | "database"
    | "external"
    | "doctor"
    | "safety"
    | "audit";
};

type Agent = {
  id: AgentId;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  description: string;
  model: string;
  functions: string[];
  kind: "ai" | "human" | "infrastructure";
};

type SimulationStep = {
  from: string;
  to: string;
  message: string;
  type: FlowType;
  duration?: number;
  isParallel?: boolean;
};

type EventItem = {
  id: number;
  from: string;
  to: string;
  message: string;
  type: FlowType;
  timestamp: string;
  status?: NodeStatus;
};

/* ============================================================
   AGENTS
============================================================ */

const AI_AGENTS: Agent[] = [
  {
    id: "atlas",
    name: "ATLAS",
    fullName: "Autonomous Task & Logic Allocation System",
    icon: "🧠",
    color: "#a78bfa",
    description: "Master Workflow Orchestrator & Decision Router",
    model: "LangChain • LangGraph",
    kind: "ai",
    functions: [
      "Intent Detection",
      "Workflow Creation",
      "State Management",
      "Decision Routing",
      "Agent Coordination",
      "Context Management",
    ],
  },
  {
    id: "aura",
    name: "AURA",
    fullName: "Audio Understanding & Response Agent",
    icon: "🎤",
    color: "#00f5d4",
    description: "Voice intake, symptom collection & patient questioning",
    model: "DeepSeek 1.5B",
    kind: "ai",
    functions: [
      "Speech Recognition",
      "Symptom Collection",
      "Cross-questioning Patient",
      "Follow-up Questions",
      "Emergency Keyword Detection",
      "Conversation Storage",
    ],
  },
  {
    id: "sentinel",
    name: "SENTINEL",
    fullName: "System for Emergency Notification & Triage Intelligence",
    icon: "🚨",
    color: "#ff5c7a",
    description: "Emergency detection and triage with escalation",
    model: "DeepSeek 1.5B",
    kind: "ai",
    functions: [
      "Emergency Detection",
      "Severity Assessment",
      "Priority Assignment",
      "Escalation Trigger",
      "Triage Storage",
    ],
  },
  {
    id: "clarity",
    name: "CLARITY",
    fullName: "Clinical Language & Report Intelligence",
    icon: "🩺",
    color: "#ffd93d",
    description: "Clinical summaries and doctor assistance",
    model: "DeepSeek 1.5B",
    kind: "ai",
    functions: [
      "Clinical Summary",
      "Doctor Questions",
      "Treatment Suggestions",
      "Report Generation",
    ],
  },
  {
    id: "nexus",
    name: "NEXUS",
    fullName: "Networked Electronic X-ray & Unified System",
    icon: "📋",
    color: "#8b7cff",
    description: "Patient history and medical records storage",
    model: "SQLite",
    kind: "ai",
    functions: [
      "Patient History",
      "Visit Records",
      "Lab Reports",
      "Medical Timeline",
      "Data Storage",
    ],
  },
  {
    id: "orbit",
    name: "ORBIT",
    fullName: "Operational Resource & Booking Intelligence",
    icon: "📅",
    color: "#44eabb",
    description: "Operations and appointment scheduling",
    model: "SQLite + Redis",
    kind: "ai",
    functions: [
      "Doctor Availability",
      "Appointment Scheduling",
      "Department Routing",
      "Resource Allocation",
    ],
  },
  {
    id: "medix",
    name: "MEDIX",
    fullName: "Medication & Drug Intelligence Xpert",
    icon: "💊",
    color: "#ff6b9d",
    description: "Medication and pharmacy intelligence",
    model: "DeepSeek 1.5B",
    kind: "ai",
    functions: [
      "Prescription Validation",
      "Drug Interaction",
      "Medication Information",
      "Dosage Validation",
    ],
  },
  {
    id: "carelink",
    name: "CARELINK",
    fullName: "Comprehensive Automated Response & Engagement Link",
    icon: "❤️",
    color: "#ff8566",
    description: "Patient follow-up, reminders and engagement",
    model: "SQLite + Email / SMS",
    kind: "ai",
    functions: [
      "Appointment Reminders",
      "Medication Reminders",
      "Health Monitoring",
      "Recovery Check-ins",
      "Patient Engagement",
      "Wellness Suggestions",
    ],
  },
];

const HUMAN_AGENTS: Agent[] = [
  {
    id: "doctor",
    name: "DOCTOR",
    fullName: "Clinical Decision Support & Patient Care",
    icon: "👨‍⚕️",
    color: "#22c55e",
    description: "Human-in-the-Loop: Only for emergencies & appointment confirmation",
    model: "Human-in-the-Loop",
    kind: "human",
    functions: [
      "Emergency Response",
      "Appointment Confirmation",
      "Complex Case Review",
      "Critical Decision Making",
    ],
  },
];

const INFRASTRUCTURE_AGENTS: Agent[] = [
  {
    id: "safety",
    name: "SAFETY",
    fullName: "Safety & Policy Engine",
    icon: "🛡️",
    color: "#f59e0b",
    description: "Clinical Safety Rules & Guardrails",
    model: "Rules Engine",
    kind: "infrastructure",
    functions: [
      "Clinical Rule Enforcement",
      "Consent Management",
      "Escalation Logic",
      "Confidence Thresholds",
      "Permission Checks",
      "Human Approval Gates",
    ],
  },
  {
    id: "audit",
    name: "AUDIT",
    fullName: "Observability & Audit Trail",
    icon: "📊",
    color: "#ec4899",
    description: "Full traceability and system observability",
    model: "Logging & Metrics",
    kind: "infrastructure",
    functions: [
      "Event Logging",
      "Metrics Collection",
      "Trace Tracking",
      "Audit Trail",
      "Performance Monitoring",
      "Compliance Reporting",
    ],
  },
];

const ALL_AGENTS = [...AI_AGENTS, ...HUMAN_AGENTS, ...INFRASTRUCTURE_AGENTS];

/* ============================================================
   ARCHITECTURE NODES
============================================================ */

const NODES: ArchitectureNode[] = [
  {
    id: "patient",
    label: "PATIENT",
    subtitle: "Voice / Web / Mobile",
    icon: "🧑",
    color: "#00f5d4",
    x: 7,
    y: 50,
    kind: "patient",
  },
  {
    id: "frontend",
    label: "PATIENT UI",
    subtitle: "React • Mobile • Voice",
    icon: "🖥️",
    color: "#4d9de0",
    x: 21,
    y: 50,
    kind: "frontend",
  },
  {
    id: "api",
    label: "API GATEWAY",
    subtitle: "FastAPI • WebSocket",
    icon: "🔌",
    color: "#4d9de0",
    x: 35,
    y: 50,
    kind: "api",
  },
  {
    id: "atlas",
    label: "ATLAS",
    subtitle: "Workflow Orchestrator",
    icon: "🧠",
    color: "#a78bfa",
    x: 50,
    y: 50,
    kind: "orchestrator",
  },
  {
    id: "safety",
    label: "SAFETY",
    subtitle: "Rules & Guardrails",
    icon: "🛡️",
    color: "#f59e0b",
    x: 50,
    y: 35,
    kind: "safety",
  },
  {
    id: "audit",
    label: "AUDIT",
    subtitle: "Observability",
    icon: "📊",
    color: "#ec4899",
    x: 50,
    y: 65,
    kind: "audit",
  },
  {
    id: "aura",
    label: "AURA",
    subtitle: "Voice & Symptoms",
    icon: "🎤",
    color: "#00f5d4",
    x: 68,
    y: 8,
    kind: "agent",
  },
  {
    id: "sentinel",
    label: "SENTINEL",
    subtitle: "Emergency & Triage",
    icon: "🚨",
    color: "#ff5c7a",
    x: 68,
    y: 20,
    kind: "agent",
  },
  {
    id: "clarity",
    label: "CLARITY",
    subtitle: "Clinical Reports",
    icon: "🩺",
    color: "#ffd93d",
    x: 68,
    y: 32,
    kind: "agent",
  },
  {
    id: "nexus",
    label: "NEXUS",
    subtitle: "Patient History",
    icon: "📋",
    color: "#8b7cff",
    x: 68,
    y: 44,
    kind: "agent",
  },
  {
    id: "orbit",
    label: "ORBIT",
    subtitle: "Scheduling",
    icon: "📅",
    color: "#44eabb",
    x: 68,
    y: 56,
    kind: "agent",
  },
  {
    id: "medix",
    label: "MEDIX",
    subtitle: "Medication",
    icon: "💊",
    color: "#ff6b9d",
    x: 68,
    y: 68,
    kind: "agent",
  },
  {
    id: "carelink",
    label: "CARELINK",
    subtitle: "Follow-up & Reminders",
    icon: "❤️",
    color: "#ff8566",
    x: 68,
    y: 80,
    kind: "agent",
  },
  {
    id: "sqlite",
    label: "SQLITE",
    subtitle: "nightingale.db",
    icon: "💾",
    color: "#38bdf8",
    x: 88,
    y: 22,
    kind: "database",
  },
  {
    id: "redis",
    label: "REDIS",
    subtitle: "Cache & Sessions",
    icon: "⚡",
    color: "#ef4444",
    x: 88,
    y: 40,
    kind: "database",
  },
  {
    id: "faiss",
    label: "FAISS",
    subtitle: "Vector Knowledge",
    icon: "🧮",
    color: "#c084fc",
    x: 88,
    y: 58,
    kind: "database",
  },
  {
    id: "external",
    label: "EXTERNAL",
    subtitle: "LLM • Speech • SMS",
    icon: "🌐",
    color: "#f59e0b",
    x: 88,
    y: 76,
    kind: "external",
  },
  {
    id: "doctor",
    label: "DOCTOR",
    subtitle: "Human-in-the-Loop",
    icon: "👨‍⚕️",
    color: "#22c55e",
    x: 50,
    y: 92,
    kind: "doctor",
  },
];

/* ============================================================
   CONNECTIONS
============================================================ */

const CONNECTIONS: [string, string][] = [
  ["patient", "frontend"],
  ["frontend", "api"],
  ["api", "atlas"],

  ["atlas", "safety"],
  ["safety", "aura"],
  ["safety", "sentinel"],
  ["safety", "nexus"],
  ["safety", "clarity"],
  ["safety", "orbit"],
  ["safety", "medix"],
  ["safety", "carelink"],
  ["safety", "doctor"],

  ["atlas", "audit"],
  ["audit", "external"],

  ["atlas", "aura"],
  ["atlas", "sentinel"],
  ["atlas", "nexus"],
  ["atlas", "clarity"],
  ["atlas", "orbit"],
  ["atlas", "medix"],
  ["atlas", "carelink"],
  ["atlas", "doctor"],

  ["aura", "external"],
  ["aura", "sqlite"],

  ["sentinel", "sqlite"],
  ["sentinel", "doctor"],

  ["nexus", "sqlite"],

  ["clarity", "doctor"],
  ["clarity", "sqlite"],

  ["orbit", "redis"],
  ["orbit", "sqlite"],
  ["orbit", "external"],

  ["medix", "faiss"],
  ["medix", "sqlite"],
  ["medix", "external"],

  ["carelink", "external"],
  ["carelink", "sqlite"],

  ["doctor", "external"],
];

/* ============================================================
   SIMULATION SCENARIOS - DOCTOR ONLY FOR EMERGENCY & APPOINTMENT
============================================================ */

const SCENARIOS: Record<
  ScenarioKey,
  SimulationStep[]
> = {
  // CONSULTATION - NO DOCTOR NEEDED
  consultation: [
    {
      from: "patient",
      to: "frontend",
      message: "Patient voice consultation received",
      type: "input",
    },
    {
      from: "frontend",
      to: "api",
      message: "POST /api/consultation",
      type: "input",
    },
    {
      from: "api",
      to: "atlas",
      message: "ATLAS received new consultation request",
      type: "routing",
    },
    
    // AURA - Patient intake
    {
      from: "atlas",
      to: "aura",
      message: "🎤 Route to AURA for patient intake",
      type: "agent",
    },
    {
      from: "aura",
      to: "external",
      message: "🎤 Speech-to-text: Patient conversation",
      type: "external",
    },
    {
      from: "aura",
      to: "patient",
      message: "💬 AURA: 'Can you describe your symptoms?'",
      type: "agent",
    },
    {
      from: "patient",
      to: "aura",
      message: "💬 Patient: 'I have a headache and fever'",
      type: "input",
    },
    {
      from: "aura",
      to: "patient",
      message: "💬 AURA: 'On a scale of 1-10, how severe?'",
      type: "agent",
    },
    {
      from: "patient",
      to: "aura",
      message: "💬 Patient: 'About a 7'",
      type: "input",
    },
    {
      from: "aura",
      to: "atlas",
      message: "📤 AURA: Symptoms collected",
      type: "agent",
    },
    
    // Safety check
    {
      from: "atlas",
      to: "safety",
      message: "🛡️ Run clinical safety rules",
      type: "agent",
    },
    {
      from: "safety",
      to: "atlas",
      message: "✅ Safety rules passed",
      type: "success",
    },
    
    // NEXUS - Medical records
    {
      from: "atlas",
      to: "nexus",
      message: "📋 Retrieve patient medical history",
      type: "agent",
    },
    {
      from: "nexus",
      to: "sqlite",
      message: "SELECT patient history",
      type: "database",
    },
    {
      from: "nexus",
      to: "atlas",
      message: "NEXUS: History retrieved",
      type: "agent",
    },
    
    // SENTINEL - Triage
    {
      from: "atlas",
      to: "sentinel",
      message: "🚨 Evaluate urgency and triage",
      type: "agent",
    },
    {
      from: "sentinel",
      to: "sqlite",
      message: "INSERT triage assessment",
      type: "database",
    },
    {
      from: "sentinel",
      to: "atlas",
      message: "SENTINEL: Triage - LOW priority",
      type: "agent",
    },
    
    // CLARITY - Clinical summary
    {
      from: "atlas",
      to: "clarity",
      message: "💡 Generate clinical summary",
      type: "agent",
    },
    {
      from: "clarity",
      to: "sqlite",
      message: "Save clinical summary",
      type: "database",
    },
    {
      from: "clarity",
      to: "atlas",
      message: "CLARITY: Summary ready",
      type: "agent",
    },
    
    // ORBIT - Scheduling
    {
      from: "atlas",
      to: "orbit",
      message: "📅 Schedule appointment",
      type: "agent",
    },
    {
      from: "orbit",
      to: "redis",
      message: "Check doctor availability",
      type: "database",
    },
    {
      from: "orbit",
      to: "sqlite",
      message: "Save appointment",
      type: "database",
    },
    {
      from: "orbit",
      to: "external",
      message: "Send appointment confirmation",
      type: "external",
    },
    {
      from: "orbit",
      to: "atlas",
      message: "ORBIT: Appointment scheduled",
      type: "agent",
    },
    
    // MEDIX - Medication validation
    {
      from: "atlas",
      to: "medix",
      message: "💊 Validate medication",
      type: "agent",
    },
    {
      from: "medix",
      to: "external",
      message: "Check drug information",
      type: "external",
    },
    {
      from: "medix",
      to: "faiss",
      message: "Retrieve medical knowledge",
      type: "database",
    },
    {
      from: "medix",
      to: "sqlite",
      message: "Store validation",
      type: "database",
    },
    {
      from: "medix",
      to: "atlas",
      message: "MEDIX: Prescription validated",
      type: "agent",
    },
    
    // CARELINK - Follow-up
    {
      from: "atlas",
      to: "carelink",
      message: "❤️ Set up follow-up",
      type: "agent",
    },
    {
      from: "carelink",
      to: "external",
      message: "Send follow-up reminders",
      type: "external",
    },
    {
      from: "carelink",
      to: "sqlite",
      message: "Save follow-up schedule",
      type: "database",
    },
    {
      from: "carelink",
      to: "atlas",
      message: "CARELINK: Follow-up ready",
      type: "agent",
    },
    
    // Complete - No doctor needed
    {
      from: "atlas",
      to: "patient",
      message: "✅ Consultation complete! No doctor intervention needed.",
      type: "success",
    },
    
    // Audit
    {
      from: "atlas",
      to: "audit",
      message: "📊 Log consultation event",
      type: "database",
    },
  ],

  // EMERGENCY - DOCTOR INTERVENES IMMEDIATELY
  emergency: [
    {
      from: "patient",
      to: "frontend",
      message: "🚨 Emergency symptoms reported",
      type: "input",
    },
    {
      from: "frontend",
      to: "api",
      message: "POST /api/emergency",
      type: "input",
    },
    {
      from: "api",
      to: "atlas",
      message: "🚨 HIGH PRIORITY request received",
      type: "routing",
    },
    
    // AURA - Emergency intake
    {
      from: "atlas",
      to: "aura",
      message: "🎤 Route to AURA for emergency intake",
      type: "agent",
    },
    {
      from: "aura",
      to: "external",
      message: "🎤 Speech-to-text: Emergency",
      type: "external",
    },
    {
      from: "aura",
      to: "patient",
      message: "💬 AURA: 'What is your emergency?'",
      type: "agent",
    },
    {
      from: "patient",
      to: "aura",
      message: "💬 Patient: 'I have severe chest pain!'",
      type: "input",
    },
    {
      from: "aura",
      to: "atlas",
      message: "🚨 AURA: Emergency detected - CHEST PAIN",
      type: "escalated",
    },
    
    // Safety check
    {
      from: "atlas",
      to: "safety",
      message: "🛡️ Run emergency safety rules",
      type: "agent",
    },
    {
      from: "safety",
      to: "atlas",
      message: "⚠️ EMERGENCY: Immediate escalation required",
      type: "escalated",
    },
    
    // SENTINEL - Emergency triage
    {
      from: "atlas",
      to: "sentinel",
      message: "🚨 IMMEDIATE emergency triage",
      type: "agent",
    },
    {
      from: "sentinel",
      to: "sqlite",
      message: "EMERGENCY triage saved",
      type: "database",
    },
    {
      from: "sentinel",
      to: "atlas",
      message: "🚨 SENTINEL: EMERGENCY CONFIRMED - Level 1",
      type: "escalated",
    },
    
    // 🚨 DOCTOR INTERVENES IMMEDIATELY
    {
      from: "atlas",
      to: "doctor",
      message: "🚨 CRITICAL ALERT: Emergency requires immediate attention",
      type: "escalated",
    },
    {
      from: "doctor",
      to: "external",
      message: "🚨 Emergency notification sent to hospital",
      type: "external",
    },
    {
      from: "doctor",
      to: "patient",
      message: "🚑 Emergency team dispatched! DOCTOR responding.",
      type: "success",
    },
    
    // Parallel tasks while doctor responds
    {
      from: "atlas",
      to: "nexus",
      message: "📋 Retrieve emergency history",
      type: "agent",
      isParallel: true,
    },
    {
      from: "atlas",
      to: "clarity",
      message: "💡 Generate emergency summary",
      type: "agent",
      isParallel: true,
    },
    {
      from: "atlas",
      to: "orbit",
      message: "📅 Allocate emergency resources",
      type: "agent",
      isParallel: true,
    },
    
    // Parallel tasks completion
    {
      from: "nexus",
      to: "sqlite",
      message: "SELECT emergency history",
      type: "database",
    },
    {
      from: "nexus",
      to: "atlas",
      message: "NEXUS: History retrieved",
      type: "agent",
    },
    {
      from: "clarity",
      to: "sqlite",
      message: "Save emergency summary",
      type: "database",
    },
    {
      from: "clarity",
      to: "atlas",
      message: "CLARITY: Summary ready",
      type: "agent",
    },
    {
      from: "orbit",
      to: "redis",
      message: "Check emergency resources",
      type: "database",
    },
    {
      from: "orbit",
      to: "sqlite",
      message: "Save resource allocation",
      type: "database",
    },
    {
      from: "orbit",
      to: "atlas",
      message: "ORBIT: Resources allocated",
      type: "agent",
    },
    
    // MEDIX - Emergency medication
    {
      from: "atlas",
      to: "medix",
      message: "💊 Validate emergency protocol",
      type: "agent",
    },
    {
      from: "medix",
      to: "external",
      message: "Check emergency drugs",
      type: "external",
    },
    {
      from: "medix",
      to: "sqlite",
      message: "Store protocol",
      type: "database",
    },
    {
      from: "medix",
      to: "atlas",
      message: "MEDIX: Protocol validated",
      type: "agent",
    },
    
    // CARELINK - Emergency follow-up
    {
      from: "atlas",
      to: "carelink",
      message: "❤️ Activate emergency follow-up",
      type: "agent",
    },
    {
      from: "carelink",
      to: "external",
      message: "Send emergency instructions to family",
      type: "external",
    },
    {
      from: "carelink",
      to: "sqlite",
      message: "Save follow-up schedule",
      type: "database",
    },
    {
      from: "carelink",
      to: "atlas",
      message: "CARELINK: Follow-up activated",
      type: "agent",
    },
    
    // Audit
    {
      from: "atlas",
      to: "audit",
      message: "📊 Log emergency event",
      type: "database",
    },
  ],

  // APPOINTMENT - DOCTOR CONFIRMS
  appointment: [
    {
      from: "patient",
      to: "frontend",
      message: "📅 Appointment request received",
      type: "input",
    },
    {
      from: "frontend",
      to: "api",
      message: "POST /api/appointments",
      type: "input",
    },
    {
      from: "api",
      to: "atlas",
      message: "Appointment intent detected",
      type: "routing",
    },
    
    // AURA - Appointment intake
    {
      from: "atlas",
      to: "aura",
      message: "🎤 Route to AURA for appointment intake",
      type: "agent",
    },
    {
      from: "aura",
      to: "patient",
      message: "💬 AURA: 'What type of appointment?'",
      type: "agent",
    },
    {
      from: "patient",
      to: "aura",
      message: "💬 Patient: 'I need to see a doctor'",
      type: "input",
    },
    {
      from: "aura",
      to: "atlas",
      message: "📤 AURA: Appointment request processed",
      type: "agent",
    },
    
    // Safety check
    {
      from: "atlas",
      to: "safety",
      message: "🛡️ Run appointment safety rules",
      type: "agent",
    },
    {
      from: "safety",
      to: "atlas",
      message: "✅ Safety rules passed",
      type: "success",
    },
    
    // NEXUS - Patient verification
    {
      from: "atlas",
      to: "nexus",
      message: "📋 Check patient records",
      type: "agent",
    },
    {
      from: "nexus",
      to: "sqlite",
      message: "SELECT patient data",
      type: "database",
    },
    {
      from: "nexus",
      to: "atlas",
      message: "NEXUS: Patient verified",
      type: "agent",
    },
    
    // ORBIT - Find availability
    {
      from: "atlas",
      to: "orbit",
      message: "📅 Find available doctor",
      type: "agent",
    },
    {
      from: "orbit",
      to: "redis",
      message: "Check doctor availability",
      type: "database",
    },
    {
      from: "orbit",
      to: "atlas",
      message: "ORBIT: Doctor found - Dr. Sharma",
      type: "agent",
    },
    
    // 📅 DOCTOR CONFIRMS APPOINTMENT
    {
      from: "atlas",
      to: "doctor",
      message: "📅 Appointment request - Doctor confirmation required",
      type: "waiting",
    },
    {
      from: "doctor",
      to: "atlas",
      message: "✅ DOCTOR: Appointment confirmed for 2:00 PM",
      type: "success",
    },
    
    // ORBIT - Save appointment
    {
      from: "atlas",
      to: "orbit",
      message: "📅 Save confirmed appointment",
      type: "agent",
    },
    {
      from: "orbit",
      to: "sqlite",
      message: "Save confirmed appointment",
      type: "database",
    },
    {
      from: "orbit",
      to: "external",
      message: "Send appointment confirmation SMS",
      type: "external",
    },
    {
      from: "orbit",
      to: "atlas",
      message: "ORBIT: Appointment confirmed",
      type: "agent",
    },
    
    // CARELINK - Reminder
    {
      from: "atlas",
      to: "carelink",
      message: "❤️ Set up appointment reminder",
      type: "agent",
    },
    {
      from: "carelink",
      to: "external",
      message: "📅 Reminder scheduled",
      type: "external",
    },
    {
      from: "carelink",
      to: "sqlite",
      message: "Save reminder",
      type: "database",
    },
    {
      from: "carelink",
      to: "atlas",
      message: "CARELINK: Reminder ready",
      type: "agent",
    },
    
    // Complete
    {
      from: "atlas",
      to: "patient",
      message: "📅 Appointment confirmed! Doctor has approved.",
      type: "success",
    },
    
    // Audit
    {
      from: "atlas",
      to: "audit",
      message: "📊 Log appointment event",
      type: "database",
    },
  ],

  // MEDICATION - DOCTOR ONLY IF COMPLEX
  medication: [
    {
      from: "patient",
      to: "frontend",
      message: "💊 Medication question received",
      type: "input",
    },
    {
      from: "frontend",
      to: "api",
      message: "POST /api/medications",
      type: "input",
    },
    {
      from: "api",
      to: "atlas",
      message: "Medication intent detected",
      type: "routing",
    },
    
    // AURA - Medication intake
    {
      from: "atlas",
      to: "aura",
      message: "🎤 Route to AURA for medication intake",
      type: "agent",
    },
    {
      from: "aura",
      to: "patient",
      message: "💬 AURA: 'What medication are you asking about?'",
      type: "agent",
    },
    {
      from: "patient",
      to: "aura",
      message: "💬 Patient: 'I want to know about Sumatriptan'",
      type: "input",
    },
    {
      from: "aura",
      to: "atlas",
      message: "📤 AURA: Medication request processed",
      type: "agent",
    },
    
    // Safety check
    {
      from: "atlas",
      to: "safety",
      message: "🛡️ Run medication safety rules",
      type: "agent",
    },
    {
      from: "safety",
      to: "atlas",
      message: "✅ Safety rules passed",
      type: "success",
    },
    
    // NEXUS - Check allergies
    {
      from: "atlas",
      to: "nexus",
      message: "📋 Check patient allergies",
      type: "agent",
    },
    {
      from: "nexus",
      to: "sqlite",
      message: "SELECT allergy data",
      type: "database",
    },
    {
      from: "nexus",
      to: "atlas",
      message: "NEXUS: No allergies found",
      type: "agent",
    },
    
    // MEDIX - Validate medication
    {
      from: "atlas",
      to: "medix",
      message: "💊 Validate medication request",
      type: "agent",
    },
    {
      from: "medix",
      to: "external",
      message: "Check drug information",
      type: "external",
    },
    {
      from: "medix",
      to: "faiss",
      message: "Retrieve medical knowledge",
      type: "database",
    },
    {
      from: "medix",
      to: "sqlite",
      message: "Store validation",
      type: "database",
    },
    {
      from: "medix",
      to: "atlas",
      message: "MEDIX: Medication validated - No doctor needed",
      type: "agent",
    },
    
    // CARELINK - Medication reminder
    {
      from: "atlas",
      to: "carelink",
      message: "❤️ Set up medication reminders",
      type: "agent",
    },
    {
      from: "carelink",
      to: "external",
      message: "💊 Reminder scheduled",
      type: "external",
    },
    {
      from: "carelink",
      to: "sqlite",
      message: "Save reminder",
      type: "database",
    },
    {
      from: "carelink",
      to: "atlas",
      message: "CARELINK: Reminders ready",
      type: "agent",
    },
    
    // Complete - No doctor needed
    {
      from: "atlas",
      to: "patient",
      message: "💊 Medication guidance ready! No doctor intervention needed.",
      type: "success",
    },
    
    // Audit
    {
      from: "atlas",
      to: "audit",
      message: "📊 Log medication event",
      type: "database",
    },
  ],
};

/* ============================================================
   HELPERS
============================================================ */

const getTime = () =>
  new Date().toLocaleTimeString("en-GB", {
    hour12: false,
  });

/* ============================================================
   COMPONENT - SIMPLIFIED HEADER REMOVED
============================================================ */

const Architecture: React.FC = () => {
  const [scenario, setScenario] =
    useState<ScenarioKey>("consultation");

  const [running, setRunning] = useState(false);

  const [paused, setPaused] = useState(false);

  const [currentStep, setCurrentStep] = useState(-1);

  const [activeNode, setActiveNode] =
    useState<string | null>(null);

  const [packet, setPacket] = useState<{
    from: string;
    to: string;
    message: string;
  } | null>(null);

  const [nodeStatuses, setNodeStatuses] =
    useState<Record<string, NodeStatus>>({});

  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [expandedAgent, setExpandedAgent] =
    useState<AgentId | null>(null);

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const eventCounter =
    useRef(0);

  const steps = useMemo(
    () => SCENARIOS[scenario],
    [scenario]
  );

  const findNode = useCallback(
    (id: string) =>
      NODES.find((node) => node.id === id),
    []
  );

  const updateStatus = useCallback(
    (id: string, status: NodeStatus) => {
      setNodeStatuses((previous) => ({
        ...previous,
        [id]: status,
      }));
    },
    []
  );

  const addEvent = useCallback(
    (
      from: string,
      to: string,
      message: string,
      type: FlowType,
      status?: NodeStatus
    ) => {
      eventCounter.current += 1;

      const event: EventItem = {
        id: eventCounter.current,
        from,
        to,
        message,
        type,
        timestamp: getTime(),
        status,
      };

      setEvents((previous) =>
        [event, ...previous].slice(0, 14)
      );
    },
    []
  );

  const resetSimulation = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRunning(false);
    setPaused(false);
    setCurrentStep(-1);
    setActiveNode(null);
    setPacket(null);
    setEvents([]);
    setNodeStatuses({});
  }, []);

  const executeStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        setRunning(false);
        setPaused(false);
        setActiveNode(null);
        setPacket(null);

        addEvent(
          "system",
          "system",
          "✅ Simulation completed successfully",
          "success",
          "completed"
        );

        return;
      }

      const step = steps[index];

      setCurrentStep(index);

      setActiveNode(step.from);

      let status: NodeStatus = "processing";
      if (step.type === "escalated") status = "escalated";
      if (step.type === "waiting") status = "waiting";
      if (step.type === "success") status = "completed";

      updateStatus(step.from, status);
      updateStatus(step.to, status);

      setPacket({
        from: step.from,
        to: step.to,
        message: step.message,
      });

      addEvent(
        step.from,
        step.to,
        step.message,
        step.type,
        status
      );

      const nextDelay = step.isParallel ? 200 : (step.duration || 1400);

      timerRef.current =
        setTimeout(() => {
          updateStatus(step.from, "completed");
          updateStatus(step.to, "completed");

          setActiveNode(step.to);
          setPacket(null);

          if (!paused && index + 1 < steps.length) {
            timerRef.current = setTimeout(() => {
              executeStep(index + 1);
            }, 200);
          } else if (index + 1 >= steps.length) {
            setRunning(false);
          }
        }, nextDelay);
    },
    [addEvent, paused, steps, updateStatus]
  );

  const startSimulation = () => {
    resetSimulation();

    setTimeout(() => {
      setRunning(true);
      executeStep(0);
    }, 100);
  };

  const togglePause = () => {
    if (!running) {
      return;
    }

    if (paused) {
      setPaused(false);

      if (currentStep >= 0 && currentStep < steps.length) {
        executeStep(currentStep);
      }
    } else {
      setPaused(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setPacket(null);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const activeAgents =
    ALL_AGENTS.filter(
      (agent) =>
        nodeStatuses[agent.id] === "processing"
    ).length;

  const escalatedAgents =
    ALL_AGENTS.filter(
      (agent) =>
        nodeStatuses[agent.id] === "escalated"
    ).length;

  const waitingAgents =
    ALL_AGENTS.filter(
      (agent) =>
        nodeStatuses[agent.id] === "waiting"
    ).length;

  const databaseWrites =
    events.filter(
      (event) =>
        event.type === "database"
    ).length;

  const completedEvents =
    Math.max(currentStep + 1, 0);

  return (
    <div className="nightingale-architecture">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .nightingale-architecture {
          min-height: 100vh;
          width: 100%;
          padding: 20px;
          color: #e5edf7;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(0,245,212,.09),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 25%,
              rgba(139,124,255,.10),
              transparent 30%
            ),
            radial-gradient(
              circle at 50% 100%,
              rgba(0,120,255,.06),
              transparent 30%
            ),
            #05070c;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .nightingale-shell {
          max-width: 1700px;
          margin: 0 auto;
        }

        /* CONTROLS - No Header */

        .simulation-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding: 13px;
          margin-bottom: 18px;
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,.09);
          background: rgba(12,17,28,.75);
          backdrop-filter: blur(15px);
        }

        .simulation-button {
          border: 1px solid rgba(148,163,184,.12);
          background: rgba(4,8,15,.8);
          color: #cbd5e1;
          padding: 10px 15px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
          transition: all .2s ease;
        }

        .simulation-button:hover {
          color: white;
          border-color: rgba(0,245,212,.35);
          transform: translateY(-1px);
        }

        .simulation-button.primary {
          color: #00110e;
          border: none;
          background:
            linear-gradient(
              135deg,
              #00f5d4,
              #00a896
            );
        }

        .scenario-selector {
          margin-left: auto;
          min-width: 220px;
          padding: 10px 13px;
          border-radius: 9px;
          border: 1px solid rgba(148,163,184,.12);
          background: #080d16;
          color: #cbd5e1;
          outline: none;
          font-size: 11px;
        }

        /* MAIN GRID - Rest of styles same as before... */
        .simulation-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            350px;
          gap: 18px;
        }

        .architecture-panel,
        .event-panel {
          border-radius: 19px;
          border: 1px solid rgba(148,163,184,.09);
          background: rgba(11,16,27,.72);
          backdrop-filter: blur(15px);
          overflow: hidden;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 17px;
          border-bottom: 1px solid rgba(148,163,184,.07);
        }

        .panel-heading-title {
          margin: 0;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .panel-heading-meta {
          color: #64748b;
          font-size: 10px;
          font-family: monospace;
        }

        /* CANVAS - Rest of styles same... */
        .architecture-canvas {
          position: relative;
          min-height: 720px;
          overflow: hidden;
          background:
            linear-gradient(
              rgba(148,163,184,.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(148,163,184,.025) 1px,
              transparent 1px
            );
          background-size: 36px 36px;
        }

        .architecture-canvas::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(139,124,255,.08),
              transparent 28%
            );
        }

        /* CONNECTION - Rest of styles same... */
        .architecture-connection {
          position: absolute;
          height: 1px;
          transform-origin: left center;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(100,116,139,.22),
              transparent
            );
          z-index: 1;
          pointer-events: none;
        }

        .architecture-connection.active {
          height: 2px;
          background:
            linear-gradient(
              90deg,
              transparent,
              #00f5d4,
              transparent
            );
          box-shadow:
            0 0 12px rgba(0,245,212,.65);
        }

        /* NODE - Rest of styles same... */
        .architecture-node {
          position: absolute;
          width: 145px;
          min-height: 82px;
          padding: 11px;
          transform:
            translate(-50%, -50%);
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,.13);
          background:
            linear-gradient(
              145deg,
              rgba(10,15,25,.98),
              rgba(5,9,16,.96)
            );
          box-shadow:
            0 15px 35px rgba(0,0,0,.32);
          z-index: 5;
          transition:
            border-color .25s ease,
            box-shadow .25s ease,
            transform .25s ease;
          cursor: pointer;
        }

        .architecture-node:hover {
          transform:
            translate(-50%, -50%)
            scale(1.04);
        }

        .architecture-node.processing {
          border-color:
            var(--node-color);
          box-shadow:
            0 0 0 1px var(--node-color),
            0 0 32px
              color-mix(
                in srgb,
                var(--node-color) 35%,
                transparent
              );
          animation:
            nodeGlow 1s
            ease-in-out
            infinite alternate;
        }

        .architecture-node.escalated {
          border-color: #ef4444;
          box-shadow:
            0 0 0 2px #ef4444,
            0 0 50px rgba(239,68,68,0.4);
          animation: escalatePulse 0.8s ease-in-out infinite alternate;
        }

        @keyframes escalatePulse {
          from {
            box-shadow: 0 0 0 2px #ef4444, 0 0 30px rgba(239,68,68,0.3);
          }
          to {
            box-shadow: 0 0 0 4px #ef4444, 0 0 60px rgba(239,68,68,0.6);
          }
        }

        .architecture-node.waiting {
          border-color: #f59e0b;
          box-shadow:
            0 0 0 1px #f59e0b,
            0 0 20px rgba(245,158,11,0.2);
          animation: waitPulse 1.5s ease-in-out infinite alternate;
        }

        @keyframes waitPulse {
          from {
            box-shadow: 0 0 0 1px #f59e0b, 0 0 10px rgba(245,158,11,0.1);
          }
          to {
            box-shadow: 0 0 0 2px #f59e0b, 0 0 30px rgba(245,158,11,0.3);
          }
        }

        @keyframes nodeGlow {
          from {
            box-shadow:
              0 0 0 1px var(--node-color),
              0 0 12px
                color-mix(
                  in srgb,
                  var(--node-color) 20%,
                  transparent
                );
          }

          to {
            box-shadow:
              0 0 0 1px var(--node-color),
              0 0 42px
                color-mix(
                  in srgb,
                  var(--node-color) 42%,
                  transparent
                );
          }
        }

        .architecture-node.completed {
          border-color:
            rgba(34,197,94,.35);
        }

        .architecture-node.atlas-node {
          width: 175px;
          min-height: 105px;
          border-color:
            rgba(167,139,250,.4);
          box-shadow:
            0 0 35px
              rgba(139,124,255,.13);
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .node-icon {
          font-size: 19px;
        }

        .node-label {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .7px;
        }

        .node-subtitle {
          margin-top: 5px;
          color: #64748b;
          font-size: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .node-status {
          margin-top: 8px;
          color: #475569;
          font-size: 8px;
          font-family: monospace;
        }

        .node.processing .node-status {
          color:
            var(--node-color);
        }

        .node.completed .node-status {
          color: #4ade80;
        }

        .node.escalated .node-status {
          color: #ef4444;
          font-weight: 700;
        }

        .node.waiting .node-status {
          color: #f59e0b;
        }

        .node-status-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-right: 5px;
          border-radius: 50%;
          background: #334155;
        }

        .node.processing .node-status-dot {
          background: var(--node-color);
          box-shadow: 0 0 8px var(--node-color);
        }

        .node.completed .node-status-dot {
          background: #22c55e;
        }

        .node.escalated .node-status-dot {
          background: #ef4444;
          box-shadow: 0 0 12px #ef4444;
        }

        .node.waiting .node-status-dot {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }

        /* DATA PACKET - Rest of styles same... */
        .data-packet {
          position: absolute;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          z-index: 20;
          background: #00f5d4;
          box-shadow:
            0 0 8px #00f5d4,
            0 0 25px rgba(0,245,212,.8);
          animation:
            movePacket
            1.4s
            ease-in-out
            forwards;
          pointer-events: none;
        }

        .data-packet::after {
          content: "";
          position: absolute;
          width: 60px;
          height: 2px;
          right: 7px;
          top: 4px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0,245,212,.7)
            );
          transform: rotate(0deg);
        }

        @keyframes movePacket {
          0% {
            left: var(--packet-from-x);
            top: var(--packet-from-y);
            opacity: 0;
            transform: scale(.4);
          }

          10% {
            opacity: 1;
            transform: scale(1);
          }

          90% {
            opacity: 1;
          }

          100% {
            left: var(--packet-to-x);
            top: var(--packet-to-y);
            opacity: 0;
            transform: scale(.5);
          }
        }

        .packet-message {
          position: absolute;
          left: 50%;
          top: -30px;
          transform:
            translateX(-50%);
          white-space: nowrap;
          padding: 5px 8px;
          border-radius: 5px;
          color: #00f5d4;
          background: rgba(4,8,15,.94);
          border: 1px solid rgba(0,245,212,.2);
          font-size: 8px;
          font-family: monospace;
        }

        /* LEGEND - Rest of styles same... */
        .architecture-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding: 13px 17px;
          border-top: 1px solid rgba(148,163,184,.07);
          color: #64748b;
          font-size: 9px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        /* EVENTS - Rest of styles same... */
        .event-panel {
          min-height: 720px;
          display: flex;
          flex-direction: column;
        }

        .live-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4ade80;
          font-size: 9px;
          font-family: monospace;
        }

        .event-list {
          flex: 1;
          overflow-y: auto;
          padding: 13px;
        }

        .event-item {
          margin-bottom: 8px;
          padding: 11px;
          border-radius: 9px;
          background: rgba(4,8,15,.55);
          border: 1px solid rgba(148,163,184,.06);
          animation:
            eventAppear
            .3s
            ease;
        }

        @keyframes eventAppear {
          from {
            opacity: 0;
            transform: translateX(12px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .event-item.input {
          border-left:
            2px solid #00f5d4;
        }

        .event-item.routing {
          border-left:
            2px solid #4d9de0;
        }

        .event-item.agent {
          border-left:
            2px solid #a78bfa;
        }

        .event-item.database {
          border-left:
            2px solid #38bdf8;
        }

        .event-item.external {
          border-left:
            2px solid #f59e0b;
        }

        .event-item.success {
          border-left:
            2px solid #22c55e;
        }

        .event-item.escalated {
          border-left:
            2px solid #ef4444;
          background: rgba(239,68,68,0.05);
        }

        .event-item.waiting {
          border-left:
            2px solid #f59e0b;
          background: rgba(245,158,11,0.05);
        }

        .event-route {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          color: #64748b;
          font-size: 8px;
          font-family: monospace;
        }

        .event-time {
          color: #334155;
        }

        .event-message {
          margin-top: 6px;
          color: #cbd5e1;
          font-size: 10px;
          line-height: 1.45;
        }

        .event-item.escalated .event-message {
          color: #fca5a5;
        }

        .event-item.waiting .event-message {
          color: #fcd34d;
        }

        .empty-events {
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 9px;
          padding: 30px;
          text-align: center;
          color: #475569;
        }

        .empty-events-icon {
          font-size: 35px;
          opacity: .5;
        }

        /* STATS - Rest of styles same... */
        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(148,163,184,.07);
        }

        .stat-box {
          padding: 9px;
          border-radius: 8px;
          text-align: center;
          background: rgba(4,8,15,.5);
        }

        .stat-value {
          color: #e2e8f0;
          font-size: 18px;
          font-weight: 900;
        }

        .stat-label {
          margin-top: 3px;
          color: #475569;
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        /* AGENT PANEL - Rest of styles same... */
        .agent-panel {
          margin-top: 20px;
          padding-bottom: 20px;
          border-radius: 19px;
          border: 1px solid rgba(148, 163, 184, 0.09);
          background: rgba(11, 16, 27, 0.72);
          backdrop-filter: blur(15px);
          overflow: hidden;
        }

        .panel-heading-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .panel-icon {
          font-size: 18px;
        }

        .panel-heading-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .agent-count-badge {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(0, 245, 212, 0.08);
          border: 1px solid rgba(0, 245, 212, 0.12);
        }

        .count-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 800;
          color: #00f5d4;
        }

        .count-label {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #64748b;
          animation: metaPulse 2s ease-in-out infinite;
        }

        @keyframes metaPulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        .agent-section-title {
          padding: 10px 20px 4px 20px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .agents-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
          padding: 10px 20px 16px 20px;
        }

        .agent-card-enhanced {
          position: relative;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.08);
          background: linear-gradient(145deg, rgba(10, 15, 25, 0.95), rgba(5, 9, 16, 0.9));
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .agent-card-enhanced::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, transparent 60%, var(--agent-glow));
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .agent-card-enhanced:hover::before {
          opacity: 1;
        }

        .agent-card-enhanced:hover {
          transform: translateY(-4px);
          border-color: var(--agent-border);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px var(--agent-glow);
        }

        .agent-card-enhanced.active {
          border-color: var(--agent-color);
          box-shadow: 0 0 0 1px var(--agent-color), 0 0 40px var(--agent-glow);
        }

        .agent-card-enhanced.completed {
          border-color: rgba(34, 197, 94, 0.3);
        }

        .agent-card-enhanced.escalated {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px #ef4444, 0 0 40px rgba(239,68,68,0.3);
        }

        .agent-card-enhanced.waiting {
          border-color: #f59e0b;
          box-shadow: 0 0 0 1px #f59e0b, 0 0 30px rgba(245,158,11,0.2);
        }

        .agent-card-enhanced.expanded {
          border-color: var(--agent-color);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px var(--agent-glow);
        }

        .agent-status-bar {
          height: 3px;
          background: rgba(148, 163, 184, 0.05);
          overflow: hidden;
        }

        .status-indicator {
          height: 100%;
          width: 0%;
          transition: width 0.6s ease, background 0.6s ease;
        }

        .status-indicator.active {
          width: 100%;
          animation: statusFlow 1.5s ease-in-out infinite;
        }

        .status-indicator.completed {
          width: 100%;
          background: #22c55e !important;
        }

        .status-indicator.escalated {
          width: 100%;
          background: #ef4444 !important;
          animation: escalatePulse 0.8s ease-in-out infinite;
        }

        .status-indicator.waiting {
          width: 100%;
          background: #f59e0b !important;
          animation: waitPulse 1.5s ease-in-out infinite;
        }

        @keyframes statusFlow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .agent-card-content {
          padding: 16px 18px 14px;
        }

        .agent-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 10px;
        }

        .agent-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .agent-card-enhanced:hover .agent-icon-wrapper {
          transform: scale(1.05);
        }

        .agent-card-icon {
          font-size: 22px;
        }

        .agent-header-info {
          flex: 1;
          min-width: 0;
        }

        .agent-card-name {
          display: block;
          font-size: 15px;
          font-weight: 800;
          color: #e2e8f0;
          letter-spacing: -0.3px;
          transition: color 0.3s ease;
        }

        .agent-card-enhanced.active .agent-card-name {
          color: var(--agent-color);
        }

        .agent-card-status {
          display: inline-block;
          margin-top: 2px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .status-badge.idle {
          color: #64748b;
          background: rgba(148, 163, 184, 0.08);
        }

        .status-badge.processing {
          color: #00f5d4;
          background: rgba(0, 245, 212, 0.12);
          animation: badgePulse 1.5s ease-in-out infinite;
        }

        .status-badge.completed {
          color: #22c55e;
          background: rgba(34, 197, 94, 0.12);
        }

        .status-badge.escalated {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          animation: escalatePulse 0.8s ease-in-out infinite;
        }

        .status-badge.waiting {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          animation: waitPulse 1.5s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .status-dot-pulse {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #00f5d4;
          animation: dotPulse 1s ease-in-out infinite;
        }

        @keyframes dotPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.5);
            opacity: 0.3;
          }
        }

        .agent-card-description {
          margin: 0 0 10px 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
        }

        .agent-kind-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(148, 163, 184, 0.08);
          color: #64748b;
        }

        .agent-kind-badge.ai {
          background: rgba(167, 139, 250, 0.15);
          color: #a78bfa;
        }

        .agent-kind-badge.human {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .agent-kind-badge.infrastructure {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        .agent-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .agent-model-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.05);
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
          font-family: monospace;
        }

        .model-icon {
          font-size: 10px;
        }

        .agent-functions-count {
          font-size: 9px;
          color: #64748b;
          font-family: monospace;
        }

        .agent-details-enhanced {
          margin-top: 12px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .agent-details-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--agent-color), transparent);
          margin-bottom: 10px;
          opacity: 0.3;
        }

        .agent-fullname {
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .agent-functions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .agent-function-enhanced {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.04);
          font-size: 9px;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.2s ease;
        }

        .agent-function-enhanced:hover {
          background: var(--agent-glow);
          border-color: var(--agent-border);
          color: #e2e8f0;
        }

        .func-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .agent-card-expand-hint {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(148, 163, 184, 0.04);
          text-align: center;
        }

        .hint-text {
          font-size: 8px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .agent-card-enhanced:hover .hint-text {
          color: #64748b;
        }

        /* RESPONSIVE */
        @media (max-width: 1250px) {
          .simulation-grid {
            grid-template-columns: 1fr;
          }

          .event-panel {
            min-height: 420px;
          }

          .agents-grid-enhanced {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
            padding: 10px 16px 14px 16px;
          }
        }

        @media (max-width: 800px) {
          .nightingale-architecture {
            padding: 15px;
          }

          .scenario-selector {
            margin-left: 0;
            width: 100%;
          }

          .architecture-panel {
            overflow-x: auto;
          }

          .architecture-canvas {
            min-width: 900px;
          }

          .agents-grid-enhanced {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            padding: 8px 14px 12px 14px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .agent-card-content {
            padding: 14px 14px 12px;
          }

          .agent-icon-wrapper {
            width: 38px;
            height: 38px;
          }

          .agent-card-icon {
            font-size: 18px;
          }

          .agent-card-name {
            font-size: 13px;
          }

          .agent-card-description {
            font-size: 11px;
          }

          .panel-heading {
            padding: 14px 16px;
          }

          .panel-heading-title {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .nightingale-architecture {
            padding: 10px;
          }

          .agents-grid-enhanced {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 6px 12px 10px 12px;
          }

          .panel-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 12px 14px;
          }

          .panel-heading-right {
            width: 100%;
            justify-content: space-between;
          }

          .agent-count-badge {
            padding: 2px 10px;
          }

          .count-number {
            font-size: 14px;
          }

          .agent-card-content {
            padding: 12px 12px 10px;
          }

          .agent-icon-wrapper {
            width: 36px;
            height: 36px;
          }

          .agent-card-icon {
            font-size: 16px;
          }

          .agent-card-name {
            font-size: 13px;
          }

          .agent-card-description {
            font-size: 11px;
          }

          .agent-fullname {
            font-size: 10px;
          }

          .agent-function-enhanced {
            font-size: 8px;
            padding: 3px 10px;
          }
        }
      `}</style>

      <div className="nightingale-shell">

        {/* CONTROLS - No Header */}

        <div className="simulation-controls">
          <button
            className="simulation-button primary"
            onClick={startSimulation}
          >
            ▶ Run Simulation
          </button>

          <button
            className="simulation-button"
            onClick={togglePause}
            disabled={!running}
          >
            {paused
              ? "▶ Resume"
              : "⏸ Pause"}
          </button>

          <button
            className="simulation-button"
            onClick={resetSimulation}
          >
            ↻ Reset
          </button>

          <select
            className="scenario-selector"
            value={scenario}
            onChange={(event) => {
              setScenario(
                event.target.value as ScenarioKey
              );

              resetSimulation();
            }}
          >
            <option value="consultation">
              🎤 Patient Consultation
            </option>

            <option value="emergency">
              🚨 Emergency Detection
            </option>

            <option value="appointment">
              📅 Appointment Booking
            </option>

            <option value="medication">
              💊 Medication Validation
            </option>
          </select>
        </div>

        {/* MAIN SIMULATION */}

        <div className="simulation-grid">

          {/* ARCHITECTURE CANVAS */}

          <section className="architecture-panel">
            <div className="panel-heading">
              <h2 className="panel-heading-title">
                Live System Topology
              </h2>

              <span className="panel-heading-meta">
                STEP{" "}
                {completedEvents}
                {" / "}
                {steps.length}
              </span>
            </div>

            <div className="architecture-canvas">

              {/* CONNECTIONS */}

              {CONNECTIONS.map(
                ([fromId, toId]) => {
                  const from =
                    findNode(fromId);

                  const to =
                    findNode(toId);

                  if (!from || !to) {
                    return null;
                  }

                  const dx =
                    to.x - from.x;

                  const dy =
                    to.y - from.y;

                  const distance =
                    Math.sqrt(
                      dx * dx +
                      dy * dy
                    );

                  const angle =
                    Math.atan2(
                      dy,
                      dx
                    ) *
                    (180 / Math.PI);

                  const active =
                    packet?.from ===
                      fromId &&
                    packet?.to ===
                      toId;

                  return (
                    <div
                      key={`${fromId}-${toId}`}
                      className={
                        `architecture-connection ${
                          active
                            ? "active"
                            : ""
                        }`
                      }
                      style={{
                        left:
                          `${from.x}%`,
                        top:
                          `${from.y}%`,
                        width:
                          `${distance}%`,
                        transform:
                          `rotate(${angle}deg)`,
                      }}
                    />
                  );
                }
              )}

              {/* ANIMATED PACKET */}

              {packet && (
                <div
                  key={`${packet.from}-${packet.to}-${currentStep}`}
                  className="data-packet"
                  style={
                    {
                      "--packet-from-x":
                        `${findNode(
                          packet.from
                        )?.x ?? 0}%`,
                      "--packet-from-y":
                        `${findNode(
                          packet.from
                        )?.y ?? 0}%`,
                      "--packet-to-x":
                        `${findNode(
                          packet.to
                        )?.x ?? 0}%`,
                      "--packet-to-y":
                        `${findNode(
                          packet.to
                        )?.y ?? 0}%`,
                    } as React.CSSProperties
                  }
                >
                  <span className="packet-message">
                    {packet.message}
                  </span>
                </div>
              )}

              {/* NODES */}

              {NODES.map((node) => {
                const status =
                  nodeStatuses[node.id];

                const isProcessing =
                  status ===
                  "processing";

                const isCompleted =
                  status ===
                  "completed";

                const isEscalated =
                  status ===
                  "escalated";

                const isWaiting =
                  status ===
                  "waiting";

                let statusClass = "";
                if (isProcessing) statusClass = "processing";
                else if (isCompleted) statusClass = "completed";
                else if (isEscalated) statusClass = "escalated";
                else if (isWaiting) statusClass = "waiting";

                return (
                  <div
                    key={node.id}
                    className={
                      `architecture-node ${statusClass} ${
                        node.kind ===
                        "orchestrator"
                          ? "atlas-node"
                          : ""
                      }`
                    }
                    style={
                      {
                        left:
                          `${node.x}%`,
                        top:
                          `${node.y}%`,
                        "--node-color":
                          node.color,
                      } as React.CSSProperties
                    }
                  >
                    <div className="node-header">
                      <span className="node-icon">
                        {node.icon}
                      </span>

                      <span className="node-label">
                        {node.label}
                      </span>
                    </div>

                    <div className="node-subtitle">
                      {node.subtitle}
                    </div>

                    <div className="node-status">
                      <span className="node-status-dot" />

                      {isProcessing
                        ? "PROCESSING"
                        : isCompleted
                        ? "COMPLETED"
                        : isEscalated
                        ? "🚨 ESCALATED"
                        : isWaiting
                        ? "⏳ WAITING"
                        : "IDLE"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="architecture-legend">
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#00f5d4",
                  }}
                />
                Active Data Flow
              </div>

              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#a78bfa",
                  }}
                />
                ATLAS Orchestrator
              </div>

              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#22c55e",
                  }}
                />
                Completed
              </div>

              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#ef4444",
                  }}
                />
                Escalated 🚨
              </div>

              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#f59e0b",
                  }}
                />
                Waiting ⏳
              </div>

              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{
                    background:
                      "#38bdf8",
                  }}
                />
                Data Layer
              </div>
            </div>
          </section>

          {/* EVENT STREAM */}

          <aside className="event-panel">
            <div className="panel-heading">
              <h2 className="panel-heading-title">
                Live Event & Audit Stream
              </h2>

              <span className="live-label">
                <span className="online-dot" />
                LIVE
              </span>
            </div>

            <div className="event-list">
              {events.length === 0 ? (
                <div className="empty-events">
                  <div className="empty-events-icon">
                    ⚡
                  </div>

                  <strong>
                    System Ready
                  </strong>

                  <span>
                    Start a simulation to
                    watch NIGHTINGALE
                    route requests through
                    the agent network.
                  </span>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={
                      `event-item ${event.type}`
                    }
                  >
                    <div className="event-route">
                      <span>
                        {event.from.toUpperCase()}
                        {" → "}
                        {event.to.toUpperCase()}
                      </span>

                      <span className="event-time">
                        {event.timestamp}
                      </span>
                    </div>

                    <div className="event-message">
                      {event.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">
                  {activeAgents}
                </div>

                <div className="stat-label">
                  Active Agents
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-value">
                  {escalatedAgents}
                </div>

                <div className="stat-label">
                  Escalated 🚨
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-value">
                  {databaseWrites}
                </div>

                <div className="stat-label">
                  DB Writes
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-value">
                  {ALL_AGENTS.length}
                </div>

                <div className="stat-label">
                  Total Agents
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ============================================================
            AGENT NETWORK - RESTRUCTURED WITH CATEGORIES
        ============================================================ */}

        <section className="agent-panel">
          <div className="panel-heading">
            <div className="panel-heading-left">
              <span className="panel-icon">🧠</span>
              <h2 className="panel-heading-title">
                AI Agent & Human-in-the-Loop Network
              </h2>
            </div>
            <div className="panel-heading-right">
              <span className="agent-count-badge">
                <span className="count-number">{ALL_AGENTS.length}</span>
                <span className="count-label">Agents</span>
              </span>
              <span className="panel-heading-meta">
                <span className="meta-dot" />
                Click to inspect
              </span>
            </div>
          </div>

          {/* AI Agents */}
          <div className="agent-section-title">🤖 AI Agents</div>
          <div className="agents-grid-enhanced">
            {AI_AGENTS.map((agent) => {
              const status = nodeStatuses[agent.id];
              const isActive = status === "processing";
              const isCompleted = status === "completed";
              const isEscalated = status === "escalated";
              const isWaiting = status === "waiting";
              const isExpanded = expandedAgent === agent.id;

              let statusClass = "";
              if (isActive) statusClass = "active";
              else if (isCompleted) statusClass = "completed";
              else if (isEscalated) statusClass = "escalated";
              else if (isWaiting) statusClass = "waiting";

              let statusLabel = "IDLE";
              let statusBadgeClass = "idle";
              if (isActive) { statusLabel = "PROCESSING"; statusBadgeClass = "processing"; }
              else if (isCompleted) { statusLabel = "✓ COMPLETED"; statusBadgeClass = "completed"; }
              else if (isEscalated) { statusLabel = "🚨 ESCALATED"; statusBadgeClass = "escalated"; }
              else if (isWaiting) { statusLabel = "⏳ WAITING"; statusBadgeClass = "waiting"; }

              return (
                <div
                  key={agent.id}
                  className={`agent-card-enhanced ${isExpanded ? "expanded" : ""} ${statusClass}`}
                  style={
                    {
                      "--agent-color": agent.color,
                      "--agent-glow": agent.color + "25",
                      "--agent-border": agent.color + "40",
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    setExpandedAgent(isExpanded ? null : agent.id);
                  }}
                >
                  <div className="agent-status-bar">
                    <div
                      className={`status-indicator ${statusClass}`}
                      style={{ background: agent.color }}
                    />
                  </div>

                  <div className="agent-card-content">
                    <div className="agent-card-header">
                      <div className="agent-icon-wrapper" style={{ background: agent.color + "15" }}>
                        <span className="agent-card-icon">{agent.icon}</span>
                      </div>
                      <div className="agent-header-info">
                        <span className="agent-card-name">{agent.name}</span>
                        <span className="agent-card-status">
                          <span className={`status-badge ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </span>
                      </div>
                    </div>

                    <p className="agent-card-description">{agent.description}</p>

                    <div className="agent-card-meta">
                      <span className="agent-kind-badge ai">AI</span>
                      <span className="agent-model-badge">
                        <span className="model-icon">🧠</span>
                        {agent.model}
                      </span>
                      <span className="agent-functions-count">
                        {agent.functions.length} functions
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="agent-details-enhanced">
                        <div className="agent-details-divider" />
                        <div className="agent-fullname">{agent.fullName}</div>
                        <div className="agent-functions-grid">
                          {agent.functions.map((func) => (
                            <span key={func} className="agent-function-enhanced">
                              <span className="func-dot" style={{ background: agent.color }} />
                              {func}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="agent-card-expand-hint">
                      <span className="hint-text">
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infrastructure Agents */}
          <div className="agent-section-title">🛡️ Infrastructure & Safety</div>
          <div className="agents-grid-enhanced">
            {INFRASTRUCTURE_AGENTS.map((agent) => {
              const status = nodeStatuses[agent.id];
              const isActive = status === "processing";
              const isCompleted = status === "completed";
              const isEscalated = status === "escalated";
              const isWaiting = status === "waiting";
              const isExpanded = expandedAgent === agent.id;

              let statusClass = "";
              if (isActive) statusClass = "active";
              else if (isCompleted) statusClass = "completed";
              else if (isEscalated) statusClass = "escalated";
              else if (isWaiting) statusClass = "waiting";

              let statusLabel = "IDLE";
              let statusBadgeClass = "idle";
              if (isActive) { statusLabel = "PROCESSING"; statusBadgeClass = "processing"; }
              else if (isCompleted) { statusLabel = "✓ COMPLETED"; statusBadgeClass = "completed"; }
              else if (isEscalated) { statusLabel = "🚨 ESCALATED"; statusBadgeClass = "escalated"; }
              else if (isWaiting) { statusLabel = "⏳ WAITING"; statusBadgeClass = "waiting"; }

              return (
                <div
                  key={agent.id}
                  className={`agent-card-enhanced ${isExpanded ? "expanded" : ""} ${statusClass}`}
                  style={
                    {
                      "--agent-color": agent.color,
                      "--agent-glow": agent.color + "25",
                      "--agent-border": agent.color + "40",
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    setExpandedAgent(isExpanded ? null : agent.id);
                  }}
                >
                  <div className="agent-status-bar">
                    <div
                      className={`status-indicator ${statusClass}`}
                      style={{ background: agent.color }}
                    />
                  </div>

                  <div className="agent-card-content">
                    <div className="agent-card-header">
                      <div className="agent-icon-wrapper" style={{ background: agent.color + "15" }}>
                        <span className="agent-card-icon">{agent.icon}</span>
                      </div>
                      <div className="agent-header-info">
                        <span className="agent-card-name">{agent.name}</span>
                        <span className="agent-card-status">
                          <span className={`status-badge ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </span>
                      </div>
                    </div>

                    <p className="agent-card-description">{agent.description}</p>

                    <div className="agent-card-meta">
                      <span className="agent-kind-badge infrastructure">Infra</span>
                      <span className="agent-model-badge">
                        <span className="model-icon">⚙️</span>
                        {agent.model}
                      </span>
                      <span className="agent-functions-count">
                        {agent.functions.length} functions
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="agent-details-enhanced">
                        <div className="agent-details-divider" />
                        <div className="agent-fullname">{agent.fullName}</div>
                        <div className="agent-functions-grid">
                          {agent.functions.map((func) => (
                            <span key={func} className="agent-function-enhanced">
                              <span className="func-dot" style={{ background: agent.color }} />
                              {func}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="agent-card-expand-hint">
                      <span className="hint-text">
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Human Agents */}
          <div className="agent-section-title">👨‍⚕️ Human-in-the-Loop</div>
          <div className="agents-grid-enhanced">
            {HUMAN_AGENTS.map((agent) => {
              const status = nodeStatuses[agent.id];
              const isActive = status === "processing";
              const isCompleted = status === "completed";
              const isEscalated = status === "escalated";
              const isWaiting = status === "waiting";
              const isExpanded = expandedAgent === agent.id;

              let statusClass = "";
              if (isActive) statusClass = "active";
              else if (isCompleted) statusClass = "completed";
              else if (isEscalated) statusClass = "escalated";
              else if (isWaiting) statusClass = "waiting";

              let statusLabel = "IDLE";
              let statusBadgeClass = "idle";
              if (isActive) { statusLabel = "PROCESSING"; statusBadgeClass = "processing"; }
              else if (isCompleted) { statusLabel = "✓ COMPLETED"; statusBadgeClass = "completed"; }
              else if (isEscalated) { statusLabel = "🚨 ESCALATED"; statusBadgeClass = "escalated"; }
              else if (isWaiting) { statusLabel = "⏳ WAITING"; statusBadgeClass = "waiting"; }

              return (
                <div
                  key={agent.id}
                  className={`agent-card-enhanced ${isExpanded ? "expanded" : ""} ${statusClass}`}
                  style={
                    {
                      "--agent-color": agent.color,
                      "--agent-glow": agent.color + "25",
                      "--agent-border": agent.color + "40",
                    } as React.CSSProperties
                  }
                  onClick={() => {
                    setExpandedAgent(isExpanded ? null : agent.id);
                  }}
                >
                  <div className="agent-status-bar">
                    <div
                      className={`status-indicator ${statusClass}`}
                      style={{ background: agent.color }}
                    />
                  </div>

                  <div className="agent-card-content">
                    <div className="agent-card-header">
                      <div className="agent-icon-wrapper" style={{ background: agent.color + "15" }}>
                        <span className="agent-card-icon">{agent.icon}</span>
                      </div>
                      <div className="agent-header-info">
                        <span className="agent-card-name">{agent.name}</span>
                        <span className="agent-card-status">
                          <span className={`status-badge ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </span>
                      </div>
                    </div>

                    <p className="agent-card-description">{agent.description}</p>

                    <div className="agent-card-meta">
                      <span className="agent-kind-badge human">Human</span>
                      <span className="agent-model-badge">
                        <span className="model-icon">🧠</span>
                        {agent.model}
                      </span>
                      <span className="agent-functions-count">
                        {agent.functions.length} functions
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="agent-details-enhanced">
                        <div className="agent-details-divider" />
                        <div className="agent-fullname">{agent.fullName}</div>
                        <div className="agent-functions-grid">
                          {agent.functions.map((func) => (
                            <span key={func} className="agent-function-enhanced">
                              <span className="func-dot" style={{ background: agent.color }} />
                              {func}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="agent-card-expand-hint">
                      <span className="hint-text">
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export { Architecture };