import React from 'react';

interface HeroProps {
  onStartAura: () => void;
  onExploreAgents: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAura, onExploreAgents }) => {
  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div>
          <div className="hero-badge">
            <span>⚕️</span>
            <span>MULTI-AGENT WORKFLOW</span>
          </div>
          <h1 className="hero-title">
            The Future<br />
            <span className="gradient-text">Hospital</span>
          </h1>
          <p className="hero-desc">Talk to One. Collaborate with Many.</p>
          <p className="hero-subtitle">
            Eight specialized AI agents working in concert to deliver 
            seamless, intelligent healthcare experiences.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onStartAura}>
              🎤 Start with AURA
            </button>
            <button className="btn-glass" onClick={onExploreAgents}>
              Explore All Agents ↓
            </button>
          </div>
        </div>

        <div className="florence-portrait">
          <div className="portrait-circle-wrapper">
            <div className="portrait-glow" />
            <div className="portrait-ring" />
            <div className="portrait-ring" />
            <div className="portrait-image-circle">
              <img 
                src="/florence-nightingale.png" 
                alt="Florence Nightingale - The Lady with the Lamp" 
              />
            </div>
          </div>
          <p className="portrait-caption">"The Lady with the Lamp"</p>
        </div>
      </div>
    </section>
  );
};