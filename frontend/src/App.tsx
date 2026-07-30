import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { BackButton } from './components/common/BackButton';
import { Hero } from './components/LandingPage/Hero';
import { AgentsGrid } from './components/LandingPage/AgentsGrid';
import { Benefits } from './components/LandingPage/Benefits';
import { Architecture } from './components/LandingPage/Architecture';
import { Workflow } from './components/LandingPage/Workflow';
import { TechStack } from './components/LandingPage/TechStack';
import { AURAAgent } from './components/agents/AURAAgent';
import { SENTINELAgent } from './components/agents/SENTINELAgent';
import { CLARITYAgent } from './components/agents/CLARITYAgent';
import { NEXUSAgent } from './components/agents/NEXUSAgent';
import { ORBITAgent } from './components/agents/ORBITAgent';
import { MEDIXAgent } from './components/agents/MEDIXAgent';
import { CARELINKAgent } from './components/agents/CARELINKAgent';
import { SAFETYAgent } from './components/agents/SAFETYAgent';
import { INFRA_Agent } from './components/agents/INFRA_Agent';
import { AUDIT_Agent } from './components/agents/AUDIT_Agent';
import { DOCTOR_Agent } from './components/agents/DOCTOR_Agent';
import { DatabaseViewer } from './components/DatabaseViewer';
import './styles/global.css';

// Agent definitions with ALL 11 agents
const AGENT_TABS = [
  { 
    id: 'AURA', 
    label: 'AURA', 
    icon: '🎤', 
    color: '#00f5d4', 
    fullForm: 'Adaptive Unified Reception Assistant',
    description: 'Voice-based patient interaction and symptom collection',
    responsibilities: [
      'Voice Conversation & Authentication',
      'Speech-to-Text Processing',
      'Symptom Collection & Follow-up',
      'Structured Intake Generation'
    ]
  },
  { 
    id: 'SENTINEL', 
    label: 'SENTINEL', 
    icon: '🚦', 
    color: '#ff6b6b', 
    fullForm: 'Smart Emergency Navigation & Triage Intelligence Engine',
    description: 'Emergency detection and severity assessment',
    responsibilities: [
      'Risk Detection & Assessment',
      'Severity Score Calculation',
      'Priority Level Assignment',
      'Emergency Alert Generation'
    ]
  },
  { 
    id: 'CLARITY', 
    label: 'CLARITY', 
    icon: '💡', 
    color: '#ffd93d', 
    fullForm: 'Clinical Learning & AI Reasoning for Intelligent Treatment',
    description: 'Clinical analysis and doctor support',
    responsibilities: [
      'Clinical Summary Creation',
      'Symptom Analysis',
      'Missing Information Detection',
      'Doctor Notes Generation'
    ]
  },
  { 
    id: 'NEXUS', 
    label: 'NEXUS', 
    icon: '🗄️', 
    color: '#6c5ce7', 
    fullForm: 'Networked Electronic eXchange for Unified Storage',
    description: 'Unified patient records and medical history',
    responsibilities: [
      'Patient History Storage',
      'Previous Visit Records',
      'Lab Report Management',
      'Medical Timeline Maintenance'
    ]
  },
  { 
    id: 'ORBIT', 
    label: 'ORBIT', 
    icon: '📅', 
    color: '#44eabb', 
    fullForm: 'Operational Resource & Booking Intelligent Tracker',
    description: 'Appointment scheduling and resource management',
    responsibilities: [
      'Doctor Availability Check',
      'Appointment Booking',
      'Department Routing',
      'Bed Allocation & Reminders'
    ]
  },
  { 
    id: 'MEDIX', 
    label: 'MEDIX', 
    icon: '💊', 
    color: '#ff6b9d', 
    fullForm: 'Medical Evaluation & Drug Intelligence eXpert',
    description: 'Medication validation and drug safety',
    responsibilities: [
      'Prescription Validation',
      'Drug Interaction Check',
      'Medicine Information',
      'Medication Reminders'
    ]
  },
  { 
    id: 'CARELINK', 
    label: 'CARELINK', 
    icon: '❤️', 
    color: '#ff8566', 
    fullForm: 'Continuous Assistance, Recovery & Engagement Link',
    description: 'Post-care follow-up and patient engagement',
    responsibilities: [
      'Appointment & Medication Reminders',
      'Health Monitoring',
      'Recovery Check-ins',
      'Escalation if Symptoms Worsen'
    ]
  },
  { 
    id: 'SAFETY', 
    label: 'SAFETY', 
    icon: '🛡️', 
    color: '#ff6b6b', 
    fullForm: 'Safety Assurance Framework for Emergency Treatment Y',
    description: 'Clinical safety rules and guardrails for patient protection',
    responsibilities: [
      'Safety Rules Enforcement',
      'Guardrails Implementation',
      'Risk Assessment',
      'Compliance Monitoring'
    ]
  },
  { 
    id: 'INFRA', 
    label: 'INFRA', 
    icon: '⚙️', 
    color: '#4db5ff', 
    fullForm: 'Infrastructure & Rules Engine',
    description: 'System infrastructure with 6 core functions',
    responsibilities: [
      'Rules Engine',
      'Configuration Management',
      'Workflow Automation',
      'System Infrastructure'
    ]
  },
  { 
    id: 'AUDIT', 
    label: 'AUDIT', 
    icon: '📊', 
    color: '#805ad5', 
    fullForm: 'Audit & Observability System',
    description: 'Full traceability with logging & metrics (6 functions)',
    responsibilities: [
      'Logging & Metrics',
      'Traceability',
      'Observability',
      'System Monitoring'
    ]
  },
  { 
    id: 'DOCTOR', 
    label: 'DOCTOR', 
    icon: '👨‍⚕️', 
    color: '#2ecc71', 
    fullForm: 'Doctor Human-in-the-Loop System',
    description: 'Human oversight for emergencies & appointment confirmation',
    responsibilities: [
      'Emergency Review',
      'Appointment Confirmation',
      'Human Oversight',
      'Critical Decisions'
    ]
  },
];

type ViewMode = 'home' | 'agents' | 'orchestra' | 'workflow' | 'benefits' | 'architecture' | 'techstack' | 'database';

function App() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [auraResponse, setAuraResponse] = useState('');
  const [sessionId] = useState(() => `patient_${Date.now()}`);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  
  // Navigation history
  const [navigationHistory, setNavigationHistory] = useState<ViewMode[]>([]);

  // Check backend status
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  // Speech recognition hook
  const {
    isListening,
    isProcessing,
    transcript,
    setTranscript,
    setIsProcessing,
    startListening
  } = useSpeechRecognition({
    onTranscript: async (text: string) => {
      await sendToAURA(text);
    },
    onError: (error: string) => {
      console.error('Speech recognition error:', error);
    }
  });

  // Send to AURA backend
  const sendToAURA = async (text: string) => {
    setIsProcessing(true);
    setAuraResponse('');

    try {
      const response = await fetch('http://localhost:8000/aura/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session_id: sessionId }),
      });

      const data = await response.json();
      
      if (data.response) {
        setAuraResponse(data.response);
      } else {
        setAuraResponse('Could you tell me more?');
      }
    } catch (error) {
      setAuraResponse('Connection error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    // Save current view to history before navigating to agent
    if (currentView !== 'home') {
      setNavigationHistory(prev => [...prev, currentView]);
    }
    setActiveAgent(agentId);
    setAgentDropdownOpen(false);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Go back to previous view
  const goBack = () => {
    // If an agent is active, go back to the previous view
    if (activeAgent) {
      setActiveAgent(null);
      // If there's navigation history, go to the last view
      if (navigationHistory.length > 0) {
        const lastView = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        setCurrentView(lastView);
      } else {
        setCurrentView('home');
      }
      setTranscript('');
      setAuraResponse('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on a non-home page, go back to the previous page or home
    if (currentView !== 'home') {
      // If there's navigation history, go to the last view
      if (navigationHistory.length > 0) {
        const lastView = navigationHistory[navigationHistory.length - 1];
        setNavigationHistory(prev => prev.slice(0, -1));
        setCurrentView(lastView);
      } else {
        // If no history, go to home
        setCurrentView('home');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If on home, do nothing
    setCurrentView('home');
  };

  // Navigate to section
  const navigateTo = (view: ViewMode) => {
    // Save current view to history if navigating to a different view
    if (currentView !== view && currentView !== 'home') {
      setNavigationHistory(prev => [...prev, currentView]);
    }
    if (activeAgent) {
      setActiveAgent(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle talk to AURA
  const handleTalkToAura = () => {
    if (activeAgent !== 'AURA') {
      setActiveAgent('AURA');
      setCurrentView('home');
    }
    setTimeout(() => {
      startListening();
    }, 300);
  };

  // Render agent content based on active agent
  const renderAgentContent = () => {
    if (!activeAgent) return null;

    switch(activeAgent) {
      case 'AURA':
        return (
          <AURAAgent
            isListening={isListening}
            isProcessing={isProcessing}
            transcript={transcript}
            auraResponse={auraResponse}
            onStartListening={startListening}
          />
        );
      case 'SENTINEL':
        return <SENTINELAgent />;
      case 'CLARITY':
        return <CLARITYAgent />;
      case 'NEXUS':
        return <NEXUSAgent />;
      case 'ORBIT':
        return <ORBITAgent />;
      case 'MEDIX':
        return <MEDIXAgent />;
      case 'CARELINK':
        return <CARELINKAgent />;
      case 'SAFETY':
        return <SAFETYAgent />;
      case 'INFRA':
        return <INFRA_Agent />;
      case 'AUDIT':
        return <AUDIT_Agent />;
      case 'DOCTOR':
        return <DOCTOR_Agent />;
      default:
        return null;
    }
  };

  // Render landing page sections based on current view
  const renderLandingPage = () => {
    // If an agent is active, show only the agent
    if (activeAgent) {
      return renderAgentContent();
    }

    switch(currentView) {
      case 'home':
        return (
          <Hero 
            onStartAura={() => handleAgentSelect('AURA')}
            onExploreAgents={() => navigateTo('orchestra')}
          />
        );
      case 'orchestra':
        return (
          <AgentsGrid 
            agents={AGENT_TABS}
            onAgentSelect={handleAgentSelect}
          />
        );
      case 'workflow':
        return <Workflow />;
      case 'benefits':
        return <Benefits />;
      case 'architecture':
        return <Architecture />;
      case 'techstack':
        return <TechStack />;
      case 'database':
        return <DatabaseViewer />;
      default:
        return null;
    }
  };

  // Determine if back button should be shown and what it should do
  const shouldShowBackButton = () => {
    return activeAgent !== null || currentView !== 'home';
  };

  return (
    <div className="app">
      <div className="grid-bg" />
      
      <Header
        agentTabs={AGENT_TABS}
        activeAgent={activeAgent}
        onAgentSelect={handleAgentSelect}
        onGoHome={() => navigateTo('home')}
        onTalkToAura={handleTalkToAura}
        onNavigate={navigateTo}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        agentDropdownOpen={agentDropdownOpen}
        setAgentDropdownOpen={setAgentDropdownOpen}
        backendStatus={backendStatus}
      />

      <div className="main-content">
        {shouldShowBackButton() && (
          <BackButton onClick={goBack} />
        )}

        {renderLandingPage()}
      </div>

      <Footer backendStatus={backendStatus} />
    </div>
  );
}

export default App;