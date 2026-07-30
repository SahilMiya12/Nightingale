import React from 'react';

interface AURAAgentProps {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  auraResponse: string;
  onStartListening: () => void;
}

export const AURAAgent: React.FC<AURAAgentProps> = ({
  isListening,
  isProcessing,
  transcript,
  auraResponse,
  onStartListening
}) => {
  return (
    <>
      <section className="aura-interface" id="aura">
        <div className="aura-card">
          <div className="aura-header">
            <div className="aura-agent-badge">
              <span>●</span>
              <span>AGENT ACTIVE</span>
            </div>
            <h2 className="aura-title">AURA</h2>
            <p className="aura-fullform">Adaptive Unified Reception Assistant</p>
          </div>

          <div className="voice-orb-container">
            <div className="voice-orb-outer" />
            <div className="voice-orb-middle" />
            <div className="voice-orb-inner" />
            <button
              className={`mic-btn ${isListening ? 'listening' : isProcessing ? 'processing' : ''}`}
              onClick={onStartListening}
              disabled={isListening || isProcessing}
            >
              {isProcessing ? '◉' : isListening ? '●' : '🎤'}
            </button>
          </div>

          <div className="voice-status-text">
            {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to Speak with AURA'}
          </div>
          <div className="voice-hint-text">
            {isListening ? 'Speak your symptoms clearly' : isProcessing ? 'ATLAS is coordinating agents...' : '"I have a headache and nausea since yesterday"'}
          </div>
        </div>
      </section>

      <section className="conversation-area">
        <div className="convo-card">
          <div className="convo-header">
            <div className="convo-avatar patient">👤</div>
            <div className="convo-label">Patient Input</div>
          </div>
          <div className={`convo-text ${!transcript ? 'empty' : ''}`}>
            {transcript || 'Waiting for voice input...'}
          </div>
        </div>
        <div className="convo-card">
          <div className="convo-header">
            <div className="convo-avatar aura">⚕️</div>
            <div className="convo-label">AURA Response</div>
          </div>
          <div className={`convo-text ${!auraResponse ? 'empty' : ''}`}>
            {isProcessing ? (
              <span style={{ color: 'var(--aurora-teal)' }}>Processing through multi-agent workflow...</span>
            ) : auraResponse || 'AURA is ready to assist. Other agents are on standby.'}
          </div>
        </div>
      </section>
    </>
  );
};