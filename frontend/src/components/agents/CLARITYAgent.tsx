import React, { useState, useEffect } from 'react';

interface ClaritySummary {
  id: number;
  patient_id: string;
  clinical_summary: string;
  symptom_analysis: string;
  missing_info: string;
  doctor_notes: string;
  recommendations: string;
  created_at: string;
  symptom: string;
  severity: string;
  triage_priority: string;
  department: string;
}

interface ClarityData {
  agent: string;
  status: string;
  total_summaries: number;
  summaries: ClaritySummary[];
  message: string;
}

export const CLARITYAgent: React.FC = () => {
  const [data, setData] = useState<ClarityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ClaritySummary | null>(null);

  useEffect(() => {
    fetchClarityData();
  }, []);

  const fetchClarityData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/clarity');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching CLARITY data:', err);
      setError('Failed to load CLARITY dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">💡 Loading...</div>
          <h2 className="section-title">CLARITY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading CLARITY dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">💡 Error</div>
          <h2 className="section-title">CLARITY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchClarityData}
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
          <div className="section-label">💡 No Data</div>
          <h2 className="section-title">CLARITY</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No CLARITY data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">💡 Clinical Agent</div>
        <h2 className="section-title">CLARITY</h2>
        <p className="section-subtitle">Clinical Learning & AI Reasoning for Intelligent Treatment</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">💡</div>
        <h3>Clinical Summaries Dashboard</h3>
        <p>AI-generated clinical summaries for doctors</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffd93d' }}>{data.total_summaries}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Summaries</div>
          </div>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#e8edf5' }}>
              {data.summaries.filter(s => s.triage_priority === 'EMERGENCY').length}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 Emergency</div>
          </div>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#e8edf5' }}>
              {data.summaries.filter(s => s.triage_priority === 'HIGH').length}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🔴 High</div>
          </div>
        </div>

        {/* Summaries List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Clinical Summaries
          </h4>
          
          {data.summaries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No clinical summaries yet. Complete a patient conversation to generate one.
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.summaries.slice(0, 10).map((summary, index) => (
                <div
                  key={index}
                  style={{
                    background: selectedSummary?.id === summary.id 
                      ? 'rgba(255,217,61,0.1)' 
                      : 'rgba(148,163,184,0.03)',
                    border: selectedSummary?.id === summary.id
                      ? '1px solid rgba(255,217,61,0.3)'
                      : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedSummary(
                    selectedSummary?.id === summary.id ? null : summary
                  )}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e8edf5' }}>
                          {summary.patient_id.slice(0, 16)}...
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: summary.triage_priority === 'EMERGENCY' ? '#dc3545' :
                                     summary.triage_priority === 'HIGH' ? '#fd7e14' :
                                     summary.triage_priority === 'ROUTINE' ? '#ffc107' : '#28a745'
                        }}>
                          {summary.triage_priority}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {summary.department}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        🩺 {summary.symptom} • 📊 {summary.severity}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px' }}>💡</div>
                  </div>

                  {/* Expanded Summary Details */}
                  {selectedSummary?.id === summary.id && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(148,163,184,0.05)',
                      borderRadius: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>📋 Clinical Summary</div>
                        <div style={{ fontSize: '14px', color: '#e8edf5', marginTop: '4px' }}>
                          {summary.clinical_summary}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>🔍 Symptom Analysis</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                          {summary.symptom_analysis}
                        </div>
                      </div>

                      {summary.missing_info && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>❓ Missing Information</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                            {summary.missing_info}
                          </div>
                        </div>
                      )}

                      {summary.recommendations && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>💡 Recommendations</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                            {summary.recommendations}
                          </div>
                        </div>
                      )}

                      {summary.doctor_notes && (
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Doctor Notes</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                            {summary.doctor_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          <button
            onClick={fetchClarityData}
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
          {['Clinical Summary Creation', 'Symptom Analysis', 'Missing Information Detection', 'Doctor Notes Generation'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(255,217,61,0.2)' }}>
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