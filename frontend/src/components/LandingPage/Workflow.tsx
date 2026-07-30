import React, { useState, useEffect } from 'react';

interface WorkflowStep {
  agent: string;
  action: string;
  color: string;
  icon: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

const workflowSteps: WorkflowStep[] = [
  { 
    agent: 'AURA', 
    action: 'Patient Speaks & Information Collected', 
    color: '#00f5d4',
    icon: '🎤',
    description: 'Voice-based patient interaction and symptom collection',
    status: 'pending'
  },
  { 
    agent: 'ATLAS', 
    action: 'Orchestrates & Routes Tasks', 
    color: '#4d9de0',
    icon: '🧠',
    description: 'Intelligent orchestration of the entire workflow',
    status: 'pending'
  },
  { 
    agent: 'SENTINEL', 
    action: 'Emergency Assessment', 
    color: '#ff6b6b',
    icon: '🚨',
    description: 'Critical triage and risk evaluation',
    status: 'pending'
  },
  { 
    agent: 'CLARITY', 
    action: 'Clinical Analysis', 
    color: '#ffd93d',
    icon: '💡',
    description: 'Deep clinical reasoning and insights',
    status: 'pending'
  },
  { 
    agent: 'NEXUS', 
    action: 'Records Retrieved', 
    color: '#6c5ce7',
    icon: '🗄️',
    description: 'Unified patient data access',
    status: 'pending'
  },
  { 
    agent: 'ORBIT', 
    action: 'Resources Allocated', 
    color: '#44eabb',
    icon: '📅',
    description: 'Smart resource management',
    status: 'pending'
  },
  { 
    agent: 'MEDIX', 
    action: 'Medication Validated', 
    color: '#ff6b9d',
    icon: '💊',
    description: 'Pharmaceutical safety checks',
    status: 'pending'
  },
  { 
    agent: 'CARELINK', 
    action: 'Follow-up Initiated', 
    color: '#ff8566',
    icon: '❤️',
    description: 'Continuous care engagement',
    status: 'pending'
  },
  { 
    agent: 'SAFETY', 
    action: 'Safety Rules Enforced', 
    color: '#ff6b6b',
    icon: '🛡️',
    description: 'Clinical safety rules and guardrails implementation',
    status: 'pending'
  },
  { 
    agent: 'INFRA', 
    action: 'Infrastructure Managed', 
    color: '#4db5ff',
    icon: '⚙️',
    description: 'Rules engine and system automation',
    status: 'pending'
  },
  { 
    agent: 'AUDIT', 
    action: 'System Observability', 
    color: '#805ad5',
    icon: '📊',
    description: 'Full traceability with logging and metrics',
    status: 'pending'
  },
  { 
    agent: 'DOCTOR', 
    action: 'Human-in-the-Loop Review', 
    color: '#2ecc71',
    icon: '👨‍⚕️',
    description: 'Human oversight for emergencies and critical decisions',
    status: 'pending'
  }
];

interface WorkflowFooterProps {
  backendStatus?: 'online' | 'offline' | 'checking';
}

export const Workflow: React.FC<WorkflowFooterProps> = ({ backendStatus = 'online' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStep, setShowStep] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionPhase, setCompletionPhase] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [activeNodes, setActiveNodes] = useState<number[]>([]);

  const totalSteps = workflowSteps.length;
  const progress = ((completedSteps.length + (showStep ? 1 : 0)) / totalSteps) * 100;
  const isComplete = completedSteps.length === totalSteps;

  useEffect(() => {
    if (!showCompletion) return;
    
    const interval = setInterval(() => {
      setActiveNodes(prev => {
        if (prev.length < workflowSteps.length) {
          return [...prev, prev.length];
        }
        return prev;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [showCompletion]);

  const advanceStep = () => {
    if (currentStep >= totalSteps - 1 && !isComplete) {
      setIsTransitioning(true);
      setShowStep(false);
      
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentStep]);
        setShowCompletion(true);
        setIsTransitioning(false);
        startCompletionAnimation();
      }, 600);
      return;
    }
    
    if (currentStep >= totalSteps - 1) return;
    
    setIsTransitioning(true);
    setShowStep(false);
    
    setTimeout(() => {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
      setShowStep(true);
      setIsTransitioning(false);
    }, 600);
  };

  const resetWorkflow = () => {
    setIsRestarting(true);
    setIsTransitioning(true);
    setShowStep(false);
    setShowCompletion(false);
    setCompletionPhase(0);
    setActiveNodes([]);
    
    setTimeout(() => {
      setCurrentStep(0);
      setCompletedSteps([]);
      setShowStep(true);
      setIsTransitioning(false);
      setIsAutoPlaying(true);
      setIsRestarting(false);
    }, 600);
  };

  const startCompletionAnimation = () => {
    setCompletionPhase(1);
    setTimeout(() => setCompletionPhase(2), 3000);
    setTimeout(() => setCompletionPhase(3), 6000);
    setTimeout(() => setCompletionPhase(4), 9000);
    setTimeout(() => {
      resetWorkflow();
    }, 12000);
  };

  useEffect(() => {
    if (!isAutoPlaying || isComplete || isRestarting) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning && currentStep < totalSteps - 1) {
        advanceStep();
      } else if (!isTransitioning && currentStep === totalSteps - 1 && !isComplete) {
        advanceStep();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, isTransitioning, isComplete, isRestarting]);

  const step = workflowSteps[currentStep];

  const render3DStepIndicator = () => {
    return (
      <div className="step-3d-container">
        <div className="step-3d-wrapper">
          <div className="step-3d-bg" />
          <div className="step-3d-bg-2" />
          
          <div className="step-3d-block">
            <div className="step-3d-face front">
              <span className="step-number-3d">{String(currentStep + 1).padStart(2, '0')}</span>
            </div>
            <div className="step-3d-face right" />
            <div className="step-3d-face bottom" />
            <div className="step-3d-face left" />
            <div className="step-3d-face top-face" />
          </div>
          
          <div className="orbit-ring ring-1" />
          <div className="orbit-ring ring-2" />
          <div className="orbit-ring ring-3" />
          
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="orbit-dot"
              style={{
                '--angle': `${i * 45}deg`,
                '--delay': `${i * 0.2}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        <div className="step-info-3d">
          <span className="step-label-3d">STEP</span>
          <div className="step-bar-3d">
            <div className="step-bar-fill-3d" style={{ width: `${(currentStep + 1) / totalSteps * 100}%` }} />
          </div>
          <span className="step-total-3d">OF {String(totalSteps).padStart(2, '0')}</span>
        </div>
      </div>
    );
  };

  const renderCompletionScene = () => {
    const nodePositions = workflowSteps.map((_, index) => {
      const angle = (index / workflowSteps.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 200;
      return {
        x: 400 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle)
      };
    });

    return (
      <div className="completion-scene">
        <div className="neural-container">
          <div className="neural-bg">
            <div className="neural-grid" />
            <div className="neural-glow" />
          </div>

          <svg className="neural-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
            {workflowSteps.map((_, i) => {
              const connections = [];
              for (let j = i + 1; j < workflowSteps.length; j++) {
                const isActive = activeNodes.includes(i) && activeNodes.includes(j);
                connections.push(
                  <line
                    key={`${i}-${j}`}
                    x1={nodePositions[i].x}
                    y1={nodePositions[i].y}
                    x2={nodePositions[j].x}
                    y2={nodePositions[j].y}
                    className={`connection-line ${isActive ? 'active' : ''}`}
                    style={{
                      stroke: isActive ? workflowSteps[j].color : 'rgba(255,255,255,0.05)',
                      strokeWidth: isActive ? 3 : 1,
                    }}
                  />
                );
              }
              return connections;
            })}

            {activeNodes.map((nodeIndex, idx) => {
              if (nodeIndex < workflowSteps.length - 1) {
                const from = nodePositions[nodeIndex];
                const to = nodePositions[nodeIndex + 1];
                return (
                  <circle
                    key={`particle-${idx}`}
                    className="data-particle"
                    cx={from.x}
                    cy={from.y}
                    r="4"
                    fill={workflowSteps[nodeIndex + 1].color}
                  >
                    <animate
                      attributeName="cx"
                      from={from.x}
                      to={to.x}
                      dur="0.8s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from={from.y}
                      to={to.y}
                      dur="0.8s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="0.8s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              }
              return null;
            })}

            {workflowSteps.map((agent, i) => {
              const isActive = activeNodes.includes(i);
              return (
                <g key={i} className="node-group">
                  <circle
                    cx={nodePositions[i].x}
                    cy={nodePositions[i].y}
                    r="35"
                    className={`node-circle ${isActive ? 'active' : ''}`}
                    style={{
                      fill: isActive ? `${agent.color}20` : 'rgba(255,255,255,0.03)',
                      stroke: isActive ? agent.color : 'rgba(255,255,255,0.1)',
                      strokeWidth: isActive ? 3 : 1,
                    }}
                  >
                    {isActive && (
                      <>
                        <animate
                          attributeName="r"
                          from="35"
                          to="45"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-width"
                          from="3"
                          to="1"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </>
                    )}
                  </circle>
                  
                  <circle
                    cx={nodePositions[i].x}
                    cy={nodePositions[i].y}
                    r="20"
                    className={`node-inner ${isActive ? 'active' : ''}`}
                    style={{
                      fill: isActive ? agent.color : 'rgba(255,255,255,0.05)',
                    }}
                  />
                  
                  <text
                    x={nodePositions[i].x}
                    y={nodePositions[i].y + 5}
                    textAnchor="middle"
                    className="node-icon"
                    style={{ fontSize: isActive ? '20px' : '14px' }}
                  >
                    {agent.icon}
                  </text>

                  <text
                    x={nodePositions[i].x}
                    y={nodePositions[i].y + 60}
                    textAnchor="middle"
                    className="node-label"
                    style={{
                      fill: isActive ? agent.color : 'rgba(255,255,255,0.3)',
                      fontSize: isActive ? '12px' : '10px',
                    }}
                  >
                    {agent.agent}
                  </text>

                  {isActive && (
                    <circle
                      cx={nodePositions[i].x}
                      cy={nodePositions[i].y}
                      r="55"
                      className="node-pulse"
                      style={{ stroke: agent.color }}
                    >
                      <animate
                        attributeName="r"
                        from="55"
                        to="80"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {activeNodes.length === workflowSteps.length && (
              <g className="center-node">
                <circle
                  cx="400"
                  cy="250"
                  r="50"
                  className="atlas-node"
                  fill="rgba(77, 157, 224, 0.15)"
                  stroke="#4d9de0"
                  strokeWidth="3"
                >
                  <animate
                    attributeName="r"
                    from="50"
                    to="65"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.8"
                    to="0.4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="400" y="255" textAnchor="middle" className="atlas-icon" fontSize="32px">
                  🧠
                </text>
                <text x="400" y="290" textAnchor="middle" className="atlas-label" fill="#4d9de0" fontSize="14px" fontWeight="700">
                  ATLAS
                </text>
                <text x="400" y="310" textAnchor="middle" className="atlas-sub" fill="#94a3b8" fontSize="10px">
                  Orchestrator
                </text>
              </g>
            )}
          </svg>

          <div className="neural-status">
            <div className="status-progress">
              <span className="status-label">NETWORK SYNAPSE</span>
              <div className="status-bar">
                <div 
                  className="status-bar-fill"
                  style={{ 
                    width: `${(activeNodes.length / workflowSteps.length) * 100}%`,
                    background: `linear-gradient(90deg, ${workflowSteps[0]?.color || '#00f5d4'}, ${workflowSteps[activeNodes.length - 1]?.color || '#4d9de0'})`
                  }}
                />
              </div>
              <span className="status-count">
                {activeNodes.length}/{workflowSteps.length}
              </span>
            </div>
          </div>

          <div className="neural-particles">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="neural-particle"
                style={{
                  '--x': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 5}s`,
                  '--duration': `${Math.random() * 8 + 4}s`,
                  '--size': `${Math.random() * 3 + 1}px`,
                  '--color': workflowSteps[Math.floor(Math.random() * workflowSteps.length)].color,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="workflow-fullpage">
      <div className="bg-base"></div>
      <div className="bg-grid"></div>
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>
      <div className="bg-glow glow-3"></div>
      
      <div className="particles-container">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${Math.random() * 4 + 2}px`,
              '--duration': `${Math.random() * 20 + 15}s`,
              '--delay': `${Math.random() * 10}s`,
              '--opacity': Math.random() * 0.3 + 0.1
            } as React.CSSProperties}
          />
        ))}
      </div>

      {showCompletion && (
        <div className="completion-overlay">
          {renderCompletionScene()}
        </div>
      )}

      <div className="progress-bar-top">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="main-content">
        <div className="floating-header">
          <div className="header-badge">
            <span className="live-dot" />
            <span>LIVE WORKFLOW</span>
          </div>
        </div>

        {render3DStepIndicator()}

        <div className={`center-stage ${showStep ? 'visible' : 'hidden'}`}>
          <div className="agent-card" style={{ '--agent-color': step.color } as React.CSSProperties}>
            <div className="card-glow" style={{ background: step.color }} />
            
            <div className="agent-avatar-container">
              <div className="avatar-ring" style={{ borderColor: step.color }}>
                <div className="avatar-inner" style={{ background: `${step.color}15` }}>
                  <span className="avatar-icon">{step.icon}</span>
                </div>
              </div>
              <div className="avatar-pulse" style={{ borderColor: step.color }} />
            </div>

            <div className="agent-info">
              <div className="agent-name-container">
                <span className="agent-name" style={{ color: step.color }}>{step.agent}</span>
                {step.agent === 'ATLAS' && <span className="crown-badge">👑</span>}
              </div>
              <h2 className="agent-action">{step.action}</h2>
              <p className="agent-description">{step.description}</p>
            </div>

            <div className="status-indicator">
              <span className="status-light active" />
              <span className="status-label">PROCESSING</span>
            </div>
          </div>
        </div>

        <div className="timeline-dots">
          {workflowSteps.map((agent, i) => (
            <button
              key={i}
              className={`timeline-dot ${i === currentStep ? 'active' : ''} ${completedSteps.includes(i) ? 'completed' : ''}`}
              style={{ '--dot-color': agent.color } as React.CSSProperties}
              onClick={() => {
                if (!isTransitioning && i !== currentStep && !showCompletion && !isRestarting) {
                  setIsTransitioning(true);
                  setShowStep(false);
                  setTimeout(() => {
                    setCompletedSteps(prev => {
                      const newCompleted = prev.filter(s => s < i);
                      if (i > currentStep) {
                        for (let j = currentStep; j < i; j++) {
                          if (!newCompleted.includes(j)) newCompleted.push(j);
                        }
                      }
                      return newCompleted;
                    });
                    setCurrentStep(i);
                    setShowStep(true);
                    setIsTransitioning(false);
                  }, 600);
                }
              }}
            >
              <span className="dot-indicator" />
            </button>
          ))}
        </div>

        <div className="floating-controls">
          <button 
            className="control-btn secondary"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            disabled={showCompletion || isRestarting}
          >
            {isAutoPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </button>
          
          {isComplete || showCompletion ? (
            <button className="control-btn primary" onClick={resetWorkflow} disabled={isRestarting}>
              RESTART
            </button>
          ) : (
            <button 
              className="control-btn primary"
              onClick={advanceStep}
              disabled={isTransitioning || isRestarting}
            >
              {currentStep === totalSteps - 1 ? 'COMPLETE' : 'NEXT STEP →'}
            </button>
          )}
        </div>
      </div>

      <div className="workflow-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🏥</span>
            <span className="footer-system-name">NIGHTINGALE MULTI-AGENT SYSTEM v1.0</span>
          </div>
          
          <div className="footer-status">
            <div className={`footer-status-dot ${backendStatus}`} />
            <span className="footer-status-text">
              {backendStatus === 'online' 
                ? 'All Agents Active' 
                : backendStatus === 'offline' 
                  ? 'System Offline' 
                  : 'Checking...'
              }
            </span>
          </div>
          
          <div className="footer-tagline">
            Privacy First • Secure by Design • Human in the Loop • Healthcare Compliant
          </div>
        </div>
      </div>

      <style>{`
        .workflow-fullpage {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          background: #06080d;
        }

        .bg-base {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          background: #06080d;
          z-index: 0;
        }

        .bg-grid {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0, 245, 212, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 212, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          z-index: 1;
          animation: gridShift 30s linear infinite;
          pointer-events: none;
        }

        @keyframes gridShift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(80px, 80px); }
        }

        .bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 1;
          opacity: 0.15;
          animation: glowFloat 10s ease-in-out infinite;
          pointer-events: none;
        }

        .glow-1 {
          width: 600px;
          height: 600px;
          background: #00f5d4;
          top: 80px;
          left: -200px;
          animation-delay: 0s;
        }

        .glow-2 {
          width: 500px;
          height: 500px;
          background: #4d9de0;
          bottom: -150px;
          right: -150px;
          animation-delay: -5s;
        }

        .glow-3 {
          width: 400px;
          height: 400px;
          background: #6c5ce7;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }

        @keyframes glowFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 20px) scale(0.9); }
        }

        .particles-container {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          pointer-events: none;
        }

        .floating-particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: rgba(0, 245, 212, 0.3);
          opacity: var(--opacity);
          animation: floatUp var(--duration) linear infinite;
          animation-delay: var(--delay);
        }

        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: var(--opacity); }
          90% { opacity: var(--opacity); }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }

        .completion-overlay {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          background: rgba(6, 8, 13, 0.98);
          backdrop-filter: blur(20px);
          animation: fadeIn 0.6s ease-out;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .completion-scene {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neural-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .neural-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .neural-grid {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(0, 245, 212, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(77, 157, 224, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 20%, rgba(108, 92, 231, 0.02) 0%, transparent 50%);
          animation: bgPulse 8s ease-in-out infinite;
        }

        @keyframes bgPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .neural-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 245, 212, 0.05), transparent 70%);
          border-radius: 50%;
          animation: glowRotate 20s linear infinite;
        }

        @keyframes glowRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }

        .neural-svg {
          width: 100%;
          max-width: 900px;
          height: 80%;
          max-height: 600px;
          z-index: 2;
        }

        .connection-line {
          transition: all 0.8s ease;
        }

        .connection-line.active {
          filter: drop-shadow(0 0 8px currentColor);
        }

        .node-circle {
          transition: all 0.8s ease;
          filter: drop-shadow(0 0 10px transparent);
        }

        .node-circle.active {
          filter: drop-shadow(0 0 20px color-mix(in srgb, var(--node-color) 50%, transparent));
        }

        .node-inner {
          transition: all 0.8s ease;
        }

        .node-inner.active {
          box-shadow: 0 0 30px currentColor;
        }

        .node-icon {
          font-family: 'Segoe UI', system-ui, sans-serif;
          pointer-events: none;
          transition: all 0.5s ease;
        }

        .node-label {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          letter-spacing: 1px;
          transition: all 0.5s ease;
        }

        .node-pulse {
          fill: none;
          stroke-width: 2;
          opacity: 0;
        }

        .data-particle {
          filter: drop-shadow(0 0 10px currentColor);
        }

        .atlas-node {
          animation: atlasPulse 2s ease-in-out infinite;
        }

        @keyframes atlasPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        .atlas-icon {
          font-family: 'Segoe UI', system-ui, sans-serif;
          pointer-events: none;
          animation: iconFloat 3s ease-in-out infinite;
        }

        .atlas-label {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 2px;
        }

        .atlas-sub {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 1px;
        }

        .neural-status {
          position: absolute;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          width: 80%;
          max-width: 500px;
        }

        .status-progress {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 2px;
          white-space: nowrap;
        }

        .status-bar {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .status-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.8s ease;
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.2);
        }

        .status-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #e8edf5;
          white-space: nowrap;
          min-width: 40px;
          text-align: right;
        }

        .neural-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .neural-particle {
          position: absolute;
          left: var(--x);
          bottom: -10px;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: var(--color);
          animation: particleRise var(--duration) ease-out var(--delay) infinite;
          opacity: 0.2;
        }

        @keyframes particleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          100% { transform: translateY(-500px) scale(0); opacity: 0; }
        }

        .progress-bar-top {
          position: fixed;
          top: 80px;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          z-index: 10;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f5d4, #4d9de0, #6c5ce7);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.3);
        }

        .main-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
          max-width: 800px;
          padding: 30px 20px 20px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .floating-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px;
          border-radius: 50px;
          background: rgba(0, 245, 212, 0.05);
          border: 1px solid rgba(0, 245, 212, 0.1);
          backdrop-filter: blur(20px);
        }

        .header-badge span {
          font-size: 11px;
          font-weight: 700;
          color: #00f5d4;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00f5d4;
          animation: livePulse 2s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(0.5); }
        }

        .step-3d-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .step-3d-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          perspective: 600px;
        }

        .step-3d-bg {
          position: absolute;
          inset: -10px;
          background: radial-gradient(circle, rgba(0, 245, 212, 0.1), transparent);
          border-radius: 50%;
          animation: bgPulse 3s ease-in-out infinite;
        }

        .step-3d-bg-2 {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(77, 157, 224, 0.05), transparent);
          border-radius: 50%;
          animation: bgPulse 3s ease-in-out infinite 0.5s;
        }

        .step-3d-block {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          animation: rotate3D 8s ease-in-out infinite;
        }

        @keyframes rotate3D {
          0%, 100% { transform: rotateX(-15deg) rotateY(15deg); }
          25% { transform: rotateX(-20deg) rotateY(25deg); }
          50% { transform: rotateX(-10deg) rotateY(5deg); }
          75% { transform: rotateX(-25deg) rotateY(20deg); }
        }

        .step-3d-face {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.15), rgba(77, 157, 224, 0.15));
          border: 2px solid rgba(0, 245, 212, 0.3);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-3d-face.front {
          transform: translateZ(25px);
          box-shadow: 0 0 40px rgba(0, 245, 212, 0.2), inset 0 0 20px rgba(0, 245, 212, 0.05);
        }

        .step-number-3d {
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #00f5d4, #4d9de0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(0, 245, 212, 0.3));
          animation: numberGlow 2s ease-in-out infinite;
        }

        @keyframes numberGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 245, 212, 0.3)); }
          50% { filter: drop-shadow(0 0 30px rgba(0, 245, 212, 0.6)); }
        }

        .orbit-ring {
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          border: 1px solid rgba(0, 245, 212, 0.15);
          animation: ringSpin 10s linear infinite;
        }

        .ring-1 { animation-duration: 10s; }
        .ring-2 { inset: -25px; animation-duration: 15s; animation-direction: reverse; border-color: rgba(77, 157, 224, 0.1); }
        .ring-3 { inset: -35px; animation-duration: 20s; border-color: rgba(108, 92, 231, 0.08); }

        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .orbit-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #00f5d4;
          box-shadow: 0 0 10px rgba(0, 245, 212, 0.5);
          top: 50%;
          left: 50%;
          animation: orbitDotMove 4s linear infinite;
          animation-delay: var(--delay);
          transform-origin: 65px;
        }

        @keyframes orbitDotMove {
          from { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(65px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          to { transform: translate(-50%, -50%) rotate(calc(var(--angle) + 360deg)) translateX(65px); opacity: 0; }
        }

        .step-info-3d {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-label-3d {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
        }

        .step-bar-3d {
          width: 120px;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .step-bar-fill-3d {
          height: 100%;
          background: linear-gradient(90deg, #00f5d4, #4d9de0);
          border-radius: 2px;
          transition: width 0.6s ease;
          box-shadow: 0 0 10px rgba(0, 245, 212, 0.3);
        }

        .step-total-3d {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
        }

        .center-stage {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          flex-shrink: 0;
        }

        .center-stage.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .center-stage.hidden {
          opacity: 0;
          transform: translateY(40px) scale(0.95);
        }

        .agent-card {
          position: relative;
          background: rgba(19, 27, 46, 0.8);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 36px 28px;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
        }

        .card-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.08;
          pointer-events: none;
        }

        .agent-avatar-container {
          position: relative;
          display: inline-flex;
          margin-bottom: 20px;
        }

        .avatar-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .avatar-inner {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-icon {
          font-size: 32px;
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .avatar-pulse {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid;
          animation: ringPulse 2s ease-out infinite;
          z-index: 1;
        }

        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .agent-info {
          margin-bottom: 20px;
        }

        .agent-name-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .agent-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          font-weight: 800;
        }

        .crown-badge {
          font-size: 20px;
          animation: crownBounce 2s ease-in-out infinite;
        }

        @keyframes crownBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-5deg); }
          75% { transform: translateY(-4px) rotate(5deg); }
        }

        .agent-action {
          font-size: 18px;
          font-weight: 700;
          color: #e8edf5;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .agent-description {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.5;
          max-width: 450px;
          margin: 0 auto;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .status-light {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-light.active {
          background: #00f5d4;
          animation: statusPulse 1.5s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(0, 245, 212, 0.4); }
          50% { box-shadow: 0 0 16px rgba(0, 245, 212, 0.8); }
        }

        .status-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 2px;
          font-family: 'JetBrains Mono', monospace;
        }

        .timeline-dots {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
          flex-wrap: wrap;
          justify-content: center;
        }

        .timeline-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          padding: 0;
        }

        .timeline-dot:hover {
          border-color: var(--dot-color);
          background: rgba(255, 255, 255, 0.02);
        }

        .timeline-dot.active {
          border-color: var(--dot-color);
          background: color-mix(in srgb, var(--dot-color) 15%, transparent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--dot-color) 20%, transparent);
          transform: scale(1.15);
        }

        .timeline-dot.completed {
          border-color: var(--dot-color);
          background: color-mix(in srgb, var(--dot-color) 10%, transparent);
        }

        .dot-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .timeline-dot.active .dot-indicator {
          background: var(--dot-color);
          box-shadow: 0 0 8px var(--dot-color);
        }

        .timeline-dot.completed .dot-indicator {
          background: var(--dot-color);
        }

        .floating-controls {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .control-btn {
          padding: 12px 28px;
          border-radius: 14px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 1px;
          backdrop-filter: blur(20px);
        }

        .control-btn.primary {
          background: linear-gradient(135deg, #00f5d4, #00b4d8);
          color: #06080d;
          box-shadow: 0 8px 32px rgba(0, 245, 212, 0.2);
        }

        .control-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 245, 212, 0.3);
        }

        .control-btn.primary:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .control-btn.secondary {
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .control-btn.secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: #e8edf5;
        }

        .control-btn.secondary:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .workflow-footer {
          position: relative;
          z-index: 3;
          width: 100%;
          background: rgba(15, 22, 37, 0.9);
          backdrop-filter: blur(30px) saturate(180%);
          border-top: 1px solid rgba(148, 163, 184, 0.08);
          flex-shrink: 0;
        }

        .footer-inner {
          max-width: 1600px;
          margin: 0 auto;
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footer-logo { font-size: 18px; }

        .footer-system-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 1px;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .footer-status-dot.online {
          background: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
          animation: statusPulse 2s ease-in-out infinite;
        }

        .footer-status-dot.offline {
          background: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }

        .footer-status-dot.checking {
          background: #f59e0b;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
          animation: blink 1s infinite;
        }

        .footer-status-text {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .footer-tagline {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .neural-svg { height: 70%; max-height: 450px; }
          .node-circle { r: 28; }
          .node-inner { r: 16; }
          .node-icon { font-size: 16px; }
          .node-label { font-size: 10px; }
          .atlas-node { r: 40; }
          .atlas-icon { font-size: 24px; }
          .atlas-label { font-size: 12px; }
          .footer-inner { padding: 12px 20px; flex-direction: column; text-align: center; gap: 8px; }
          .agent-card { padding: 24px 20px; }
          .agent-name { font-size: 20px; }
          .agent-action { font-size: 16px; }
          .main-content { padding: 20px 15px 15px; gap: 15px; }
          .step-3d-wrapper { width: 80px; height: 80px; }
          .step-number-3d { font-size: 36px; }
          .timeline-dots { gap: 8px; }
          .timeline-dot { width: 30px; height: 30px; }
          .neural-status { bottom: 40px; width: 90%; }
          .status-progress { padding: 12px 16px; flex-wrap: wrap; justify-content: center; }
          .status-label { font-size: 10px; }
          .status-count { font-size: 12px; }
        }

        @media (max-width: 480px) {
          .neural-svg { height: 60%; max-height: 350px; }
          .node-circle { r: 22; }
          .node-inner { r: 12; }
          .node-icon { font-size: 12px; }
          .node-label { font-size: 8px; }
          .node-circle.active { r: 28; }
          .atlas-node { r: 32; }
          .atlas-icon { font-size: 18px; }
          .atlas-label { font-size: 10px; }
          .atlas-sub { font-size: 8px; }
          .step-3d-wrapper { width: 60px; height: 60px; }
          .step-number-3d { font-size: 28px; }
          .step-bar-3d { width: 80px; }
          .agent-card { padding: 20px 16px; }
          .agent-name { font-size: 18px; }
          .agent-action { font-size: 14px; }
          .agent-description { font-size: 12px; }
          .avatar-ring { width: 60px; height: 60px; }
          .avatar-inner { width: 52px; height: 52px; }
          .avatar-icon { font-size: 24px; }
          .control-btn { padding: 8px 16px; font-size: 10px; }
          .timeline-dot { width: 24px; height: 24px; }
          .timeline-dots { gap: 6px; }
          .neural-status { bottom: 30px; width: 95%; }
          .status-progress { padding: 10px 12px; gap: 10px; }
        }
      `}</style>
    </div>
  );
};