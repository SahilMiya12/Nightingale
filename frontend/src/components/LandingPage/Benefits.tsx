import React, { useState } from 'react';

const benefits = [
  { 
    icon: '⚡', 
    title: 'Faster Triage & Response', 
    desc: 'Quickly identify emergencies and prioritize care with SENTINEL agent.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    borderColor: '#ffd93d'
  },
  { 
    icon: '📋', 
    title: 'Better Clinical Support', 
    desc: 'Doctors get summarized and structured insights from CLARITY.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: '#00f5d4'
  },
  { 
    icon: '🔗', 
    title: 'Unified Patient Records', 
    desc: 'All medical data in one connected system via NEXUS.',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    borderColor: '#6c5ce7'
  },
  { 
    icon: '⚙️', 
    title: 'Operational Efficiency', 
    desc: 'Smart scheduling and resource management by ORBIT.',
    gradient: 'from-green-500/20 to-teal-500/20',
    borderColor: '#44eabb'
  },
  { 
    icon: '💊', 
    title: 'Medication Safety', 
    desc: 'Reduce errors with validation & interaction checks by MEDIX.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    borderColor: '#ff6b9d'
  },
  { 
    icon: '❤️', 
    title: 'Continuous Patient Care', 
    desc: 'Follow-up, reminders and recovery monitoring by CARELINK.',
    gradient: 'from-red-500/20 to-orange-500/20',
    borderColor: '#ff8566'
  }
];

export const Benefits: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="benefits-section" id="benefits-section">
      <div className="section-header">
        <div className="section-label">
          <span className="label-line" />
          <span>Why Multi-Agent</span>
          <span className="label-line" />
        </div>
        <h2 className="section-title">Key Benefits</h2>
        <p className="section-subtitle">Empowering healthcare with intelligent multi-agent collaboration</p>
      </div>
      <div className="benefits-grid">
        {benefits.map((benefit, i) => {
          const isHovered = hoveredIndex === i;
          
          return (
            <div 
              key={i} 
              className={`benefit-card ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                '--border-color': benefit.borderColor,
                '--glow-color': benefit.borderColor + '25',
              } as React.CSSProperties}
            >
              <div className="benefit-card-inner">
                <div className="benefit-glow" style={{ background: `radial-gradient(circle, ${benefit.borderColor}30 0%, transparent 70%)` }} />
                <div className="benefit-icon-wrapper">
                  <div className="benefit-icon-bg" style={{ background: benefit.borderColor + '15' }}>
                    <span className="benefit-icon">{benefit.icon}</span>
                  </div>
                </div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-desc">{benefit.desc}</p>
                <div className="benefit-arrow">
                  <span className="arrow-line" />
                  <span className="arrow-icon">→</span>
                </div>
                <div className="benefit-number">0{i + 1}</div>
              </div>
              <div className="benefit-border" style={{ background: `linear-gradient(90deg, ${benefit.borderColor}40, ${benefit.borderColor}80)` }} />
            </div>
          );
        })}
      </div>

      <style>{`
        .benefits-section {
          padding: 40px 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
          position: relative;
        }

        .section-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .section-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 8px;
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
          font-size: 10px;
          font-weight: 700;
          color: #00f5d4;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .section-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #e8edf5;
          margin: 0 0 6px 0;
          letter-spacing: -1px;
        }

        .section-subtitle {
          font-size: 14px;
          color: #94a3b8;
          max-width: 500px;
          margin: 0 auto;
          font-weight: 300;
          letter-spacing: 0.5px;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 28px;
        }

        .benefit-card {
          position: relative;
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(10, 15, 25, 0.95), rgba(5, 9, 16, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.06);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .benefit-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: var(--border-color);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .benefit-card.hovered {
          transform: translateY(-8px) scale(1.02);
          border-color: var(--border-color);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px var(--glow-color);
        }

        .benefit-card.hovered::before {
          opacity: 0.05;
        }

        .benefit-card-inner {
          padding: 28px 24px 24px;
          position: relative;
          z-index: 2;
        }

        .benefit-glow {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transition: opacity 0.6s ease;
          pointer-events: none;
          border-radius: 50%;
        }

        .benefit-card.hovered .benefit-glow {
          opacity: 1;
        }

        .benefit-icon-wrapper {
          margin-bottom: 16px;
        }

        .benefit-icon-bg {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .benefit-card.hovered .benefit-icon-bg {
          transform: scale(1.1) rotate(-5deg);
        }

        .benefit-icon {
          font-size: 28px;
          transition: transform 0.3s ease;
        }

        .benefit-card.hovered .benefit-icon {
          transform: scale(1.1);
        }

        .benefit-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #e8edf5;
          margin: 0 0 8px 0;
          letter-spacing: -0.3px;
          line-height: 1.3;
        }

        .benefit-desc {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 16px 0;
          font-weight: 300;
        }

        .benefit-arrow {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.4s ease;
        }

        .benefit-card.hovered .benefit-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .arrow-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--border-color), transparent);
          max-width: 40px;
        }

        .arrow-icon {
          font-size: 16px;
          color: var(--border-color);
          transition: transform 0.3s ease;
        }

        .benefit-card.hovered .arrow-icon {
          transform: translateX(4px);
        }

        .benefit-number {
          position: absolute;
          top: 12px;
          right: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.15);
          letter-spacing: 1px;
          transition: color 0.3s ease;
        }

        .benefit-card.hovered .benefit-number {
          color: var(--border-color);
        }

        .benefit-border {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .benefit-card.hovered .benefit-border {
          transform: scaleX(1);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .benefits-section {
            padding: 30px 40px 50px;
          }

          .benefits-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 24px;
          }

          .section-title {
            font-size: 34px;
          }
        }

        @media (max-width: 768px) {
          .benefits-section {
            padding: 24px 20px 40px;
          }

          .section-header {
            margin-bottom: 24px;
          }

          .section-title {
            font-size: 28px;
          }

          .section-subtitle {
            font-size: 13px;
          }

          .benefits-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 20px;
          }

          .benefit-card-inner {
            padding: 20px 18px 18px;
          }

          .benefit-icon-bg {
            width: 48px;
            height: 48px;
          }

          .benefit-icon {
            font-size: 24px;
          }

          .benefit-title {
            font-size: 15px;
          }

          .benefit-desc {
            font-size: 12px;
          }

          .section-label span:not(.label-line) {
            font-size: 9px;
          }

          .label-line {
            width: 25px;
          }
        }

        @media (max-width: 480px) {
          .benefits-section {
            padding: 20px 16px 30px;
          }

          .section-title {
            font-size: 22px;
          }

          .section-subtitle {
            font-size: 12px;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .benefit-card-inner {
            padding: 18px 16px 16px;
          }

          .benefit-icon-bg {
            width: 44px;
            height: 44px;
          }

          .benefit-icon {
            font-size: 22px;
          }

          .benefit-title {
            font-size: 14px;
          }

          .benefit-desc {
            font-size: 12px;
          }

          .benefit-number {
            font-size: 10px;
            top: 8px;
            right: 12px;
          }
        }
      `}</style>
    </section>
  );
};