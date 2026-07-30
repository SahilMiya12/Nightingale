import React, { useState, useEffect } from 'react';

interface SafetyLog {
  id: number;
  patient_id: string;
  rule_name: string;
  rule_check: string;
  passed: boolean;
  severity: string;
  details: string;
  created_at: string;
}

interface SafetyStats {
  total: number;
  passed: number;
  failed: number;
  by_severity: Record<string, number>;
}

interface SafetyData {
  agent: string;
  status: string;
  stats: SafetyStats;
  logs: SafetyLog[];
  message: string;
}

export const SAFETYAgent: React.FC = () => {
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<SafetyLog | null>(null);

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/safety');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching SAFETY data:', err);
      setError('Failed to load SAFETY dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      'critical': '#dc3545',
      'warning': '#fd7e14',
      'info': '#17a2b8'
    };
    return colors[severity] || '#6c757d';
  };

  const getSeverityBadge = (severity: string): string => {
    const badges: Record<string, string> = {
      'critical': '🚨 CRITICAL',
      'warning': '⚠️ WARNING',
      'info': 'ℹ️ INFO'
    };
    return badges[severity] || 'Unknown';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🛡️ Loading...</div>
          <h2 className="section-title">SAFETY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading safety logs...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🛡️ Error</div>
          <h2 className="section-title">SAFETY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchSafetyData}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #94a3b8',
              background: 'transparent',
              color: '#e8edf5',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🛡️ No Data</div>
          <h2 className="section-title">SAFETY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No safety data available</p>
        </div>
      </section>
    );
  }

  const stats = data.stats || { total: 0, passed: 0, failed: 0, by_severity: {} };
  const totalChecks = stats.total || 0;
  const passedChecks = stats.passed || 0;
  const failedChecks = stats.failed || 0;
  const passRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">🛡️ Safety Agent</div>
        <h2 className="section-title">SAFETY</h2>
        <p className="section-subtitle">Clinical Safety Rules & Guardrails</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">🛡️</div>
        <h3>Safety Rules Engine</h3>
        <p>Clinical safety rules and guardrails for patient protection</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b6b' }}>{totalChecks}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Checks</div>
          </div>
          <div style={{ background: 'rgba(40,167,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>{passedChecks}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>✅ Passed</div>
          </div>
          <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{failedChecks}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>❌ Failed</div>
          </div>
          <div style={{ background: 'rgba(23,162,184,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(23,162,184,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#17a2b8' }}>{passRate}%</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>📊 Pass Rate</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '10px', fontSize: '13px' }}>📊 Severity Breakdown</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(stats.by_severity || {}).map(([severity, count]) => (
              <div key={severity} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(148,163,184,0.05)',
                borderRadius: '20px',
                border: `1px solid ${getSeverityColor(severity)}40`
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getSeverityColor(severity)
                }} />
                <span style={{ fontSize: '12px', color: '#e8edf5' }}>{severity}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Recent Safety Logs ({data.logs.length})
          </h4>
          
          {data.logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No safety logs found
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.logs.slice(0, 10).map((log) => {
                const severityColor = getSeverityColor(log.severity);
                const isSelected = selectedLog?.id === log.id;

                return (
                  <div
                    key={log.id}
                    style={{
                      background: isSelected ? 'rgba(255,107,107,0.1)' : 'rgba(148,163,184,0.03)',
                      border: isSelected ? '1px solid rgba(255,107,107,0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: severityColor
                        }}>
                          {getSeverityBadge(log.severity)}
                        </span>
                        <span style={{ fontSize: '13px', color: '#e8edf5' }}>{log.rule_name}</span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: log.passed ? '#28a745' : '#dc3545'
                        }}>
                          {log.passed ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>

                    {/* Expanded Log Details */}
                    {isSelected && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        background: 'rgba(148,163,184,0.05)',
                        borderRadius: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Rule Check</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-word' }}>
                            {log.rule_check || 'No details available'}
                          </div>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📋 Details</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                            {log.details || 'No additional details'}
                          </div>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>🆔 Patient ID</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {log.patient_id || 'No patient'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          <button
            onClick={fetchSafetyData}
            style={{
              padding: '14px 36px',
              borderRadius: '14px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        <div className="agent-feature-grid" style={{ marginTop: '20px' }}>
          {['Safety Rules', 'Guardrails', 'Risk Assessment', 'Compliance'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(255,77,77,0.2)' }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};