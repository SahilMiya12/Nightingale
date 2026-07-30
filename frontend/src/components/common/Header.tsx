import React, { useRef, useEffect } from 'react';

interface AgentTab {
  id: string;
  label: string;
  icon: string;
  color: string;
  fullForm: string;
}

type ViewMode = 'home' | 'agents' | 'orchestra' | 'workflow' | 'benefits' | 'architecture' | 'techstack' | 'database';

interface HeaderProps {
  agentTabs: AgentTab[];
  activeAgent: string | null;
  onAgentSelect: (agentId: string) => void;
  onGoHome: () => void;
  onTalkToAura: () => void;
  onNavigate: (view: ViewMode) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  agentDropdownOpen: boolean;
  setAgentDropdownOpen: (open: boolean) => void;
  backendStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  agentTabs,
  activeAgent,
  onAgentSelect,
  onGoHome,
  onTalkToAura,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  agentDropdownOpen,
  setAgentDropdownOpen,
  backendStatus
}) => {
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAgentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setAgentDropdownOpen]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-area" onClick={onGoHome}>
          <div className="logo-symbol">
            <img 
              src="/florence-nightingale.png" 
              alt="Florence Nightingale" 
            />
          </div>
          <div>
            <div className="logo-text-main">NIGHTINGALE</div>
            <div className="logo-subtitle">Multi-Agent System</div>
          </div>
        </div>

        <nav>
          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a className="nav-item" href="#" onClick={(e) => { e.preventDefault(); onGoHome(); }}>Home</a></li>
            
            {/* Agents Dropdown */}
            <li className="dropdown-wrapper" ref={dropdownRef}>
              <a 
                className="nav-item dropdown-trigger" 
                onClick={(e) => {
                  e.preventDefault();
                  setAgentDropdownOpen(!agentDropdownOpen);
                }}
                href="#"
              >
                Agents
                <span className={`dropdown-arrow ${agentDropdownOpen ? 'open' : ''}`}>▼</span>
              </a>
              
              {agentDropdownOpen && (
                <div className="dropdown-menu">
                  {agentTabs.map(agent => (
                    <button
                      key={agent.id}
                      className="dropdown-item"
                      onClick={() => {
                        onAgentSelect(agent.id);
                        setAgentDropdownOpen(false);
                      }}
                    >
                      <div 
                        className="dropdown-item-icon" 
                        style={{ background: `${agent.color}20` }}
                      >
                        {agent.icon}
                      </div>
                      <div className="dropdown-item-content">
                        <div className="dropdown-item-name">{agent.label}</div>
                        <div className="dropdown-item-desc">{agent.fullForm}</div>
                      </div>
                      <span className="dropdown-item-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </li>
            
            {/* Navigation Links */}
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('orchestra');
                }}
              >
                Core Orchestra
              </a>
            </li>
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('benefits');
                }}
              >
                Benefits
              </a>
            </li>
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('workflow');
                }}
              >
                Care Flow
              </a>
            </li>
            
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('architecture');
                }}
              >
                Architecture
              </a>
            </li>
            
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('techstack');
                }}
              >
                Tech Stack
              </a>
            </li>
            
            <li>
              <a 
                className="nav-item" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('database');
                }}
              >
                🗄️ Database
              </a>
            </li>
            
            <li>
              <a href="http://localhost:8000/dashboard" target="_blank" rel="noopener noreferrer" className="nav-item">Dashboard</a>
            </li>
            <li>
              <button 
                className="nav-cta" 
                onClick={() => {
                  if (activeAgent !== 'AURA') {
                    onAgentSelect('AURA');
                  }
                  onTalkToAura();
                }}
              >
                Talk to AURA
              </button>
            </li>
          </ul>
        </nav>

        <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};