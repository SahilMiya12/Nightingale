import React from 'react';

interface FooterProps {
  backendStatus: string;
}

export const Footer: React.FC<FooterProps> = ({ backendStatus }) => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-text">
          🏥 NIGHTINGALE MULTI-AGENT SYSTEM v1.0
        </div>
        <div className="footer-status">
          <div className={`footer-dot ${backendStatus}`} />
          <span>
            {backendStatus === 'online' 
              ? 'All Agents Active' 
              : backendStatus === 'offline' 
                ? 'System Offline' 
                : 'Checking...'
            }
          </span>
        </div>
        <div className="footer-text" style={{ fontSize: '10px' }}>
          Privacy First • Secure by Design • Human in the Loop • Healthcare Compliant
        </div>
      </div>
    </footer>
  );
};