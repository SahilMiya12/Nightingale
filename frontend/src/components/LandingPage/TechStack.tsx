import React, { useState } from 'react';

const techStack = [
  { 
    category: 'Frontend', 
    tech: 'React • TypeScript • CSS',
    icon: '🎨',
    color: '#00f5d4'
  },
  { 
    category: 'Backend', 
    tech: 'FastAPI (Python)',
    icon: '⚡',
    color: '#ff6b6b'
  },
  { 
    category: 'AI Framework', 
    tech: 'LangChain / LangGraph',
    icon: '🧠',
    color: '#ffd93d'
  },
  { 
    category: 'LLM', 
    tech: 'DeepSeek R1',
    icon: '🤖',
    color: '#6c5ce7'
  },
  { 
    category: 'Database', 
    tech: 'SQLite / PostgreSQL',
    icon: '🗄️',
    color: '#44eabb'
  },
  { 
    category: 'Speech Recognition', 
    tech: 'Web Speech API',
    icon: '🎤',
    color: '#ff6b9d'
  },
  { 
    category: 'Deployment', 
    tech: 'Vercel • Railway / Render',
    icon: '🚀',
    color: '#ff8566'
  }
];

export const TechStack: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="tech-section" id="tech">
      <div className="section-header">
        <div className="section-label">
          <span className="label-line" />
          <span>Technology</span>
          <span className="label-line" />
        </div>
        <h2 className="section-title">Tech Stack</h2>
        <p className="section-subtitle">Modern tools powering our multi-agent system</p>
      </div>
      <div className="tech-grid">
        {techStack.map((tech, i) => {
          const isHovered = hoveredIndex === i;
          
          return (
            <div 
              key={i} 
              className={`tech-card ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                '--tech-color': tech.color,
                '--tech-glow': tech.color + '25',
              } as React.CSSProperties}
            >
              <div className="tech-card-inner">
                <div className="tech-glow" style={{ background: `radial-gradient(circle, ${tech.color}30 0%, transparent 70%)` }} />
                <div className="tech-icon-wrapper">
                  <div className="tech-icon-bg" style={{ background: tech.color + '15' }}>
                    <span className="tech-icon">{tech.icon}</span>
                  </div>
                </div>
                <div className="tech-content">
                  <h3 className="tech-category">{tech.category}</h3>
                  <p className="tech-name">{tech.tech}</p>
                </div>
                <div className="tech-number">0{i + 1}</div>
              </div>
              <div className="tech-border" style={{ background: `linear-gradient(90deg, ${tech.color}40, ${tech.color}80)` }} />
            </div>
          );
        })}
      </div>

      <style>{`
        .tech-section {
          padding: 30px 20px 40px;
          max-width: 1200px;
          margin: 0 auto;
          background: transparent;
          position: relative;
        }

        .section-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .section-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .label-line {
          width: 30px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 245, 212, 0.3));
        }

        .label-line:last-child {
          background: linear-gradient(90deg, rgba(0, 245, 212, 0.3), transparent);
        }

        .section-label span:not(.label-line) {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          color: #00f5d4;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .section-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #e8edf5;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .section-subtitle {
          font-size: 12px;
          color: #94a3b8;
          max-width: 400px;
          margin: 0 auto;
          font-weight: 300;
          letter-spacing: 0.3px;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .tech-card {
          position: relative;
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(10, 15, 25, 0.95), rgba(5, 9, 16, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.06);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .tech-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background: var(--tech-color);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .tech-card.hovered {
          transform: translateY(-3px) scale(1.01);
          border-color: var(--tech-color);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 40px var(--tech-glow);
        }

        .tech-card.hovered::before {
          opacity: 0.05;
        }

        .tech-card-inner {
          padding: 14px 14px 12px;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tech-glow {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          border-radius: 50%;
        }

        .tech-card.hovered .tech-glow {
          opacity: 1;
        }

        .tech-icon-wrapper {
          flex-shrink: 0;
        }

        .tech-icon-bg {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .tech-card.hovered .tech-icon-bg {
          transform: scale(1.05) rotate(-3deg);
        }

        .tech-icon {
          font-size: 20px;
          transition: transform 0.3s ease;
        }

        .tech-card.hovered .tech-icon {
          transform: scale(1.05);
        }

        .tech-content {
          flex: 1;
          min-width: 0;
        }

        .tech-category {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: var(--tech-color);
          margin: 0 0 2px 0;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .tech-name {
          font-size: 10px;
          color: #e8edf5;
          margin: 0;
          font-weight: 500;
          letter-spacing: -0.1px;
          line-height: 1.3;
          word-break: break-word;
        }

        .tech-number {
          position: absolute;
          top: 6px;
          right: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.1);
          letter-spacing: 0.5px;
          transition: color 0.3s ease;
        }

        .tech-card.hovered .tech-number {
          color: var(--tech-color);
        }

        .tech-border {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tech-card.hovered .tech-border {
          transform: scaleX(1);
        }

        /* Tablet and larger screens */
        @media (min-width: 768px) {
          .tech-section {
            padding: 40px 40px 60px;
          }

          .section-header {
            margin-bottom: 32px;
          }

          .section-label {
            gap: 16px;
            margin-bottom: 8px;
          }

          .label-line {
            width: 40px;
          }

          .section-label span:not(.label-line) {
            font-size: 10px;
            letter-spacing: 3px;
          }

          .section-title {
            font-size: 38px;
            margin: 0 0 6px 0;
            letter-spacing: -1px;
          }

          .section-subtitle {
            font-size: 14px;
            max-width: 500px;
            letter-spacing: 0.5px;
          }

          .tech-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
          }

          .tech-card-inner {
            padding: 20px 20px 18px;
            gap: 16px;
          }

          .tech-icon-bg {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }

          .tech-icon {
            font-size: 26px;
          }

          .tech-category {
            font-size: 13px;
            margin: 0 0 4px 0;
            letter-spacing: 0.5px;
          }

          .tech-name {
            font-size: 14px;
            letter-spacing: -0.2px;
          }

          .tech-number {
            font-size: 10px;
            top: 10px;
            right: 14px;
            letter-spacing: 1px;
          }

          .tech-card {
            border-radius: 20px;
          }

          .tech-card::before {
            border-radius: 20px;
          }

          .tech-card.hovered {
            transform: translateY(-6px) scale(1.02);
          }
        }

        /* Larger screens */
        @media (min-width: 1024px) {
          .tech-section {
            padding: 40px 40px 60px;
          }

          .tech-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
          }

          .section-title {
            font-size: 42px;
          }
        }
      `}</style>
    </section>
  );
};