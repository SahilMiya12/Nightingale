import React, { useState } from 'react';

interface Agent {
  id: string;
  label: string;
  icon: string;
  color: string;
  fullForm: string;
  description?: string;
  status?: 'idle' | 'active' | 'busy';
}

interface AgentsGridProps {
  agents: Agent[];
  onAgentSelect: (agentId: string) => void;
}

export const AgentsGrid: React.FC<AgentsGridProps> = ({ agents, onAgentSelect }) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // All 11 agents data
  const allAgents: Agent[] = [
    {
      id: 'aura',
      label: 'AURA',
      icon: '🌐',
      color: '#6366f1',
      fullForm: 'Advanced Unified Reasoning Agent',
      description: 'Orchestrates multi-agent collaboration and workflow management',
      status: 'active'
    },
    {
      id: 'carelink',
      label: 'CARELINK',
      icon: '🔗',
      color: '#0ea5e9',
      fullForm: 'Connected Assistance & Referral Exchange Link',
      description: 'Manages patient referrals and care coordination',
      status: 'active'
    },
    {
      id: 'clarity',
      label: 'CLARITY',
      icon: '💡',
      color: '#fbbf24',
      fullForm: 'Clinical Learning & AI Reasoning for Intelligent Treatment',
      description: 'Generates clinical summaries and assists with diagnosis',
      status: 'active'
    },
    {
      id: 'medix',
      label: 'MEDIX',
      icon: '🏥',
      color: '#ec4899',
      fullForm: 'Medical Expert Diagnostic Intelligence X',
      description: 'Provides medical diagnosis support and treatment recommendations',
      status: 'active'
    },
    {
      id: 'nexus',
      label: 'NEXUS',
      icon: '🔮',
      color: '#8b5cf6',
      fullForm: 'Networked Exchange & Unified System',
      description: 'Integrates data from multiple healthcare systems',
      status: 'active'
    },
    {
      id: 'orbit',
      label: 'ORBIT',
      icon: '🛰️',
      color: '#06b6d4',
      fullForm: 'Optimized Resource & Bed Intelligence Tracker',
      description: 'Tracks hospital resources and bed availability',
      status: 'active'
    },
    {
      id: 'sentinel',
      label: 'SENTINEL',
      icon: '🛡️',
      color: '#f43f5e',
      fullForm: 'Security & Emergency Notification Intelligence Network',
      description: 'Monitors for emergencies and security threats',
      status: 'active'
    },
    {
      id: 'safety',
      label: 'SAFETY',
      icon: '🛡️',
      color: '#ff6b6b',
      fullForm: 'Safety Assurance Framework for Emergency Treatment Y',
      description: 'Enforces clinical safety rules and guardrails',
      status: 'idle'
    },
    {
      id: 'infra',
      label: 'INFRA',
      icon: '⚙️',
      color: '#4db5ff',
      fullForm: 'Infrastructure & Rules Engine',
      description: 'Manages system infrastructure with 6 core functions',
      status: 'idle'
    },
    {
      id: 'audit',
      label: 'AUDIT',
      icon: '📊',
      color: '#805ad5',
      fullForm: 'Audit & Observability System',
      description: 'Full traceability with logging & metrics (6 functions)',
      status: 'idle'
    },
    {
      id: 'doctor',
      label: 'DOCTOR',
      icon: '👨‍⚕️',
      color: '#2ecc71',
      fullForm: 'Doctor Human-in-the-Loop System',
      description: 'Human oversight for emergencies & appointment confirmation',
      status: 'idle'
    }
  ];

  // Use provided agents or fallback to all agents
  const displayAgents = agents && agents.length > 0 ? agents : allAgents;

  return (
    <section className="agents-section" id="agents-section">
      <div className="section-header">
        <div className="section-label">
          <span className="label-line" />
          <span>Multi-Agent System</span>
          <span className="label-line" />
        </div>
        <h2 className="section-title">Eleven Specialized AI Agents</h2>
        <p className="section-subtitle">Each agent has a specific role in the healthcare workflow</p>
      </div>

      <div className="agents-grid">
        {displayAgents.map(agent => {
          const isHovered = hoveredAgent === agent.id;
          
          return (
            <div 
              key={agent.id} 
              className={`agent-card ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              onClick={() => onAgentSelect(agent.id)}
              style={{
                '--agent-color': agent.color,
                '--agent-glow': agent.color + '25',
                '--agent-border': agent.color + '40',
                '--agent-bg': agent.color + '10',
              } as React.CSSProperties}
            >
              {/* Status bar */}
              <div className="agent-status-bar">
                <div 
                  className="agent-status-indicator" 
                  style={{ background: agent.color }}
                />
              </div>

              <div className="agent-card-content">
                <div className="agent-card-header">
                  <div className="agent-icon-wrapper" style={{ background: agent.color + '15' }}>
                    <span className="agent-icon">{agent.icon}</span>
                  </div>
                  <div className="agent-status-badge">
                    <span className="status-dot" style={{ background: agent.color }} />
                    <span className="status-label">{agent.status || 'Active'}</span>
                  </div>
                </div>

                <h3 className="agent-name" style={{ color: agent.color }}>
                  {agent.label}
                </h3>
                
                <p className="agent-fullform">{agent.fullForm}</p>
                
                {agent.description && (
                  <p className="agent-description">{agent.description}</p>
                )}

                <div className="agent-card-footer">
                  <button 
                    className="agent-select-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgentSelect(agent.id);
                    }}
                  >
                    <span>Open {agent.label}</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  
                  <div className="agent-hover-glow" style={{ background: agent.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .agents-section {
          padding: 60px 40px 40px;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
        }

        .section-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .section-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .label-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 245, 212, 0.3));
        }

        .label-line:last-child {
          background: linear-gradient(90deg, rgba(0, 245, 212, 0.3), transparent);
        }

        .section-label span:not(.label-line) {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #00f5d4;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .section-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #e8edf5;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
        }

        .section-subtitle {
          font-size: 16px;
          color: #94a3b8;
          max-width: 500px;
          margin: 0 auto;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .agent-card {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.06);
          background: linear-gradient(145deg, rgba(10, 15, 25, 0.95), rgba(5, 9, 16, 0.9));
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .agent-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: var(--agent-bg);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .agent-card:hover::before {
          opacity: 1;
        }

        .agent-card.hovered {
          transform: translateY(-6px);
          border-color: var(--agent-border);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4), 0 0 40px var(--agent-glow);
        }

        .agent-status-bar {
          height: 3px;
          background: rgba(148, 163, 184, 0.05);
          overflow: hidden;
        }

        .agent-status-indicator {
          height: 100%;
          width: 0%;
          transition: width 0.6s ease;
        }

        .agent-card.hovered .agent-status-indicator {
          width: 100%;
        }

        .agent-card-content {
          padding: 24px 24px 20px;
        }

        .agent-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .agent-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .agent-card.hovered .agent-icon-wrapper {
          transform: scale(1.05);
        }

        .agent-icon {
          font-size: 28px;
        }

        .agent-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.04);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .status-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .agent-name {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 6px 0;
          letter-spacing: -0.3px;
          transition: color 0.3s ease;
        }

        .agent-fullform {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 8px 0;
          line-height: 1.4;
          min-height: 34px;
        }

        .agent-description {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .agent-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.04);
        }

        .agent-select-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.06);
          background: rgba(255, 255, 255, 0.02);
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .agent-select-btn:hover {
          border-color: var(--agent-color);
          color: #e8edf5;
          background: var(--agent-bg);
          transform: translateX(4px);
        }

        .btn-arrow {
          transition: transform 0.3s ease;
        }

        .agent-select-btn:hover .btn-arrow {
          transform: translateX(4px);
          color: var(--agent-color);
        }

        .agent-hover-glow {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.4s ease;
          filter: blur(40px);
        }

        .agent-card.hovered .agent-hover-glow {
          opacity: 0.2;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .agents-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .agents-section {
            padding: 40px 20px 30px;
          }

          .section-title {
            font-size: 28px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .agents-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
          }

          .agent-card-content {
            padding: 20px 18px 16px;
          }

          .agent-icon-wrapper {
            width: 48px;
            height: 48px;
          }

          .agent-icon {
            font-size: 24px;
          }

          .agent-name {
            font-size: 17px;
          }

          .agent-fullform {
            font-size: 11px;
            min-height: 28px;
          }

          .agent-select-btn {
            font-size: 10px;
            padding: 6px 16px;
          }

          .section-label span:not(.label-line) {
            font-size: 10px;
          }

          .label-line {
            width: 30px;
          }
        }

        @media (max-width: 480px) {
          .agents-section {
            padding: 30px 16px 20px;
          }

          .section-title {
            font-size: 22px;
          }

          .agents-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .agent-card-content {
            padding: 16px 16px 14px;
          }

          .agent-icon-wrapper {
            width: 44px;
            height: 44px;
          }

          .agent-icon {
            font-size: 20px;
          }

          .agent-name {
            font-size: 16px;
          }

          .agent-status-badge {
            padding: 2px 10px;
          }

          .status-label {
            font-size: 7px;
          }
        }
      `}</style>
    </section>
  );
};