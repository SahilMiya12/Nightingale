import React, { useState, useEffect } from 'react';

interface MedixSuggestion {
  id: number;
  patient_id: string;
  symptom: string;
  severity: string;
  triage_level: number;
  medication_name: string;
  dosage: string;
  home_remedy: string;
  warning: string;
  is_emergency: boolean;
  created_at: string;
}

interface MedixData {
  agent: string;
  status: string;
  total_suggestions: number;
  suggestions: MedixSuggestion[];
  message: string;
}

export const MEDIXAgent: React.FC = () => {
  const [data, setData] = useState<MedixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MedixSuggestion | null>(null);

  useEffect(() => {
    fetchMedixData();
  }, []);

  const fetchMedixData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/medix');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching MEDIX data:', err);
      setError('Failed to load MEDIX dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTriageLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: '🚨 Emergency',
      2: '🔴 High',
      3: '🟡 Routine',
      4: '🟢 Information'
    };
    return labels[level] || 'Unknown';
  };

  const getTriageColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: '#dc3545',
      2: '#fd7e14',
      3: '#ffc107',
      4: '#28a745'
    };
    return colors[level] || '#6c757d';
  };

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">💊 Loading...</div>
          <h2 className="section-title">MEDIX</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading medication suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">💊 Error</div>
          <h2 className="section-title">MEDIX</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchMedixData}
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
          <div className="section-label">💊 No Data</div>
          <h2 className="section-title">MEDIX</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No MEDIX suggestions available</p>
        </div>
      </section>
    );
  }

  const totalSuggestions = data.total_suggestions;
  const emergencyCases = data.suggestions.filter(s => s.is_emergency).length;
  const routineCases = data.suggestions.filter(s => s.triage_level === 3 || s.triage_level === 4).length;

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">💊 Pharmacy Agent</div>
        <h2 className="section-title">MEDIX</h2>
        <p className="section-subtitle">Medical Evaluation & Drug Intelligence eXpert</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">💊</div>
        <h3>Medication Management</h3>
        <p>Prescription validation and drug safety</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b9d' }}>{totalSuggestions}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Suggestions</div>
          </div>
          <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{emergencyCases}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 Emergency</div>
          </div>
          <div style={{ background: 'rgba(255,193,7,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,193,7,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>{routineCases}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🟡 Routine</div>
          </div>
        </div>

        {/* Suggestions List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Medication Suggestions ({totalSuggestions})
          </h4>
          
          {data.suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No medication suggestions yet
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.suggestions.slice(0, 10).map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    background: selectedSuggestion?.id === suggestion.id 
                      ? 'rgba(255,107,157,0.1)' 
                      : 'rgba(148,163,184,0.03)',
                    border: selectedSuggestion?.id === suggestion.id
                      ? '1px solid rgba(255,107,157,0.3)'
                      : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedSuggestion(
                    selectedSuggestion?.id === suggestion.id ? null : suggestion
                  )}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e8edf5' }}>
                          {suggestion.patient_id.slice(0, 16)}...
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: suggestion.is_emergency ? '#dc3545' : '#28a745'
                        }}>
                          {suggestion.is_emergency ? '🚨 EMERGENCY' : '✅ SAFE'}
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: getTriageColor(suggestion.triage_level)
                        }}>
                          {getTriageLabel(suggestion.triage_level)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        💊 {suggestion.medication_name} • 🩺 {suggestion.symptom}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px' }}>💊</div>
                  </div>

                  {/* Expanded Suggestion Details */}
                  {selectedSuggestion?.id === suggestion.id && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'rgba(148,163,184,0.05)',
                      borderRadius: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      animation: 'fadeIn 0.3s ease'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>💊 Medication</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5', fontWeight: '600' }}>
                            {suggestion.medication_name}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>💉 Dosage</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{suggestion.dosage}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>🩺 Symptom</div>
                        <div style={{ fontSize: '14px', color: '#e8edf5' }}>{suggestion.symptom}</div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>🏠 Home Remedy</div>
                        <div style={{ fontSize: '14px', color: '#94a3b8' }}>{suggestion.home_remedy}</div>
                      </div>

                      <div style={{ marginTop: '12px', padding: '10px 14px', background: suggestion.is_emergency ? 'rgba(220,53,69,0.1)' : 'rgba(40,167,69,0.1)', borderRadius: '8px', borderLeft: `4px solid ${suggestion.is_emergency ? '#dc3545' : '#28a745'}` }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>⚠️ Warning</div>
                        <div style={{ fontSize: '13px', color: suggestion.is_emergency ? '#dc3545' : '#94a3b8' }}>
                          {suggestion.warning}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
                        <span>📊 Triage Level: {suggestion.triage_level}</span>
                        <span>📅 {new Date(suggestion.created_at).toLocaleString()}</span>
                      </div>
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
            onClick={fetchMedixData}
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
          {['Prescription Check', 'Drug Interactions', 'Medication Info', 'Dosage Validation'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(255,107,157,0.2)' }}>
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