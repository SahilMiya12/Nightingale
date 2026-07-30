import React from 'react';

export const INFRA_Agent: React.FC = () => {
  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">⚙️ Infrastructure Agent</div>
        <h2 className="section-title">INFRA</h2>
        <p className="section-subtitle">Rules Engine & System Infrastructure</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">⚙️</div>
        <h3>Rules Engine</h3>
        <p>6 functions - System infrastructure and rule management</p>
        <div className="agent-feature-grid">
          {['Rules Engine', 'Configuration', 'Workflow', 'Automation'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(77,181,255,0.2)' }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};