import React, { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  patient_id: string;
  agent: string;
  action: string;
  details: string;
  status: string;
  timestamp: string;
}

interface AuditStats {
  total: number;
  today: number;
  by_agent: Record<string, number>;
  by_status: Record<string, number>;
}

interface AuditData {
  agent: string;
  status: string;
  stats: AuditStats;
  logs: AuditLog[];
  message: string;
}

export const AUDIT_Agent: React.FC = () => {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/audit');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching AUDIT data:', err);
      setError('Failed to load AUDIT dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'success': '#28a745',
      'warning': '#ffc107',
      'error': '#dc3545',
      'emergency': '#dc3545',
      'info': '#17a2b8'
    };
    return colors[status] || '#6c757d';
  };

  const getAgentColor = (agent: string): string => {
    const colors: Record<string, string> = {
      'AURA': '#00f5d4',
      'SENTINEL': '#ff6b6b',
      'CLARITY': '#ffd93d',
      'NEXUS': '#6c5ce7',
      'ORBIT': '#44eabb',
      'MEDIX': '#ff6b9d',
      'CARELINK': '#ff8566',
      'AUDIT': '#805ad5'
    };
    return colors[agent] || '#94a3b8';
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
          <div className="section-label">📊 Loading...</div>
          <h2 className="section-title">AUDIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading audit logs...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">📊 Error</div>
          <h2 className="section-title">AUDIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchAuditData}
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
          <div className="section-label">📊 No Data</div>
          <h2 className="section-title">AUDIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No audit data available</p>
        </div>
      </section>
    );
  }

  const stats = data.stats || { total: 0, today: 0, by_agent: {}, by_status: {} };
  const totalLogs = stats.total || 0;
  const todayLogs = stats.today || 0;
  const agentCounts = stats.by_agent || {};
  const statusCounts = stats.by_status || {};

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">📊 Audit Agent</div>
        <h2 className="section-title">AUDIT</h2>
        <p className="section-subtitle">Full traceability and system observability</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">📊</div>
        <h3>Logging & Metrics</h3>
        <p>6 functions - Full system observability and traceability</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#805ad5' }}>{totalLogs}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Logs</div>
          </div>
          <div style={{ background: 'rgba(23,162,184,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(23,162,184,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#17a2b8' }}>{todayLogs}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>📅 Today</div>
          </div>
          <div style={{ background: 'rgba(40,167,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>{statusCounts['success'] || 0}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>✅ Success</div>
          </div>
          <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{(statusCounts['error'] || 0) + (statusCounts['emergency'] || 0)}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 Errors</div>
          </div>
        </div>

        {/* Agent Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '10px', fontSize: '13px' }}>🤖 Agent Activity</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(agentCounts).map(([agent, count]) => (
              <div key={agent} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(148,163,184,0.05)',
                borderRadius: '20px',
                border: `1px solid ${getAgentColor(agent)}40`
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getAgentColor(agent)
                }} />
                <span style={{ fontSize: '12px', color: '#e8edf5' }}>{agent}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Recent Audit Logs ({data.logs.length})
          </h4>
          
          {data.logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No audit logs found
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.logs.slice(0, 10).map((log) => {
                const statusColor = getStatusColor(log.status);
                const agentColor = getAgentColor(log.agent);
                const isSelected = selectedLog?.id === log.id;

                return (
                  <div
                    key={log.id}
                    style={{
                      background: isSelected ? 'rgba(128,90,213,0.1)' : 'rgba(148,163,184,0.03)',
                      border: isSelected ? '1px solid rgba(128,90,213,0.3)' : '1px solid var(--border-subtle)',
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
                          background: agentColor
                        }}>
                          {log.agent}
                        </span>
                        <span style={{ fontSize: '13px', color: '#e8edf5' }}>{log.action}</span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: statusColor
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatTimestamp(log.timestamp)}
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
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Details</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-word' }}>
                            {log.details || 'No details available'}
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
            onClick={fetchAuditData}
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
          {['Logging', 'Metrics', 'Traceability', 'Observability'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(128,90,213,0.2)' }}>
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