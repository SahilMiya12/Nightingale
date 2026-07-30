import React, { useState, useEffect } from 'react';

interface PatientDetail {
  patient_id: string;
  created_at: string;
  symptom: string;
  onset: string;
  severity: string;
  location: string;
  additional: string;
  medication: string;
  triage_priority: string;
  triage_level: number;
  triage_reason: string;
  triage_recommendation: string;
  triage_department: string;
}

interface SentinelData {
  agent: string;
  status: string;
  total_cases: number;
  emergency_cases: number;
  high_priority: number;
  routine_cases: number;
  info_cases: number;
  severity_distribution: {
    Emergency: number;
    High: number;
    Routine: number;
    Information: number;
  };
  recent_triages: any[];
  message: string;
}

interface PatientResponse {
  patients: PatientDetail[];
  total: number;
  error?: string;
}

export const SENTINELAgent: React.FC = () => {
  const [data, setData] = useState<SentinelData | null>(null);
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);

  useEffect(() => {
    fetchSentinelData();
    fetchPatients();
  }, []);

  const fetchSentinelData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/sentinel');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching SENTINEL data:', err);
      setError('Failed to load SENTINEL dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/sentinel/patients');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: PatientResponse = await response.json();
      setPatients(result.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const getLevelColor = (level: number): string => {
    const colors = {
      1: '#dc3545',
      2: '#fd7e14',
      3: '#ffc107',
      4: '#28a745'
    };
    return colors[level as keyof typeof colors] || '#6c757d';
  };

  const getPriorityEmoji = (level: number): string => {
    const emojis = {
      1: '🚨',
      2: '🔴',
      3: '🟡',
      4: '🟢'
    };
    return emojis[level as keyof typeof emojis] || '⚪';
  };

  // If showing the full dashboard (iframe)
  if (showDashboard) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🚦 Triage Agent</div>
          <h2 className="section-title">SENTINEL</h2>
          <p className="section-subtitle">Smart Emergency Navigation & Triage Intelligence Engine</p>
        </div>
        
        <div className="agent-dashboard-card">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setShowDashboard(false)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,107,107,0.3)',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                marginBottom: '16px'
              }}
            >
              ← Back to Patient List
            </button>
          </div>
          <iframe 
            src="http://localhost:8000/dashboard/sentinel" 
            style={{
              width: '100%',
              height: '600px',
              border: 'none',
              borderRadius: '12px'
            }}
            title="SENTINEL Dashboard"
          />
        </div>
      </section>
    );
  }

  // Main View - Patient List with expandable details
  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">🚦 Triage Agent</div>
        <h2 className="section-title">SENTINEL</h2>
        <p className="section-subtitle">Smart Emergency Navigation & Triage Intelligence Engine</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">🚦</div>
        <h3>Triage Dashboard</h3>
        <p>View all patients and their triage status</p>
        
        {/* Stats Summary */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#94a3b8' }}>⏳ Loading triage data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#ef4444' }}>❌ {error}</p>
            <button 
              onClick={fetchSentinelData}
              style={{
                marginTop: '12px',
                padding: '8px 20px',
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
        ) : data ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            margin: '16px 0 20px'
          }}>
            <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#e8edf5' }}>{data.total_cases}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Cases</div>
            </div>
            <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{data.emergency_cases}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 Emergency</div>
            </div>
            <div style={{ background: 'rgba(253,126,20,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(253,126,20,0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fd7e14' }}>{data.high_priority}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>🔴 High</div>
            </div>
            <div style={{ background: 'rgba(255,193,7,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,193,7,0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>{data.routine_cases}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>🟡 Routine</div>
            </div>
          </div>
        ) : null}

        {/* Patient List */}
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '16px' }}>
            📋 Patient List ({patients.length})
          </h4>
          
          {loadingPatients ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No patients found
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {patients.map((patient, index) => (
                <div
                  key={index}
                  style={{
                    background: selectedPatient?.patient_id === patient.patient_id 
                      ? 'rgba(255,107,107,0.1)' 
                      : 'rgba(148,163,184,0.03)',
                    border: selectedPatient?.patient_id === patient.patient_id
                      ? '1px solid rgba(255,107,107,0.3)'
                      : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => setSelectedPatient(
                    selectedPatient?.patient_id === patient.patient_id ? null : patient
                  )}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e8edf5' }}>
                          {patient.patient_id.slice(0, 20)}...
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 12px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: patient.triage_priority !== 'Not triaged' 
                            ? getLevelColor(patient.triage_level) 
                            : '#6c757d'
                        }}>
                          {patient.triage_priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {patient.symptom !== 'Not collected' ? `🩺 ${patient.symptom}` : 'No symptoms recorded'}
                        {patient.location !== 'Not collected' && ` • 📍 ${patient.location}`}
                        {patient.severity !== 'Not collected' && ` • 📊 ${patient.severity}`}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px' }}>
                      {getPriorityEmoji(patient.triage_level)}
                    </div>
                  </div>

                  {/* Expanded Patient Details */}
                  {selectedPatient?.patient_id === patient.patient_id && (
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
                          <div style={{ fontSize: '11px', color: '#64748b' }}>🩺 Symptom</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.symptom}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📅 Onset</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.onset}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📊 Severity</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.severity}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📍 Location</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.location}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>💊 Medication</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.medication}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Additional</div>
                          <div style={{ fontSize: '14px', color: '#e8edf5' }}>{patient.additional}</div>
                        </div>
                      </div>
                      
                      {/* Triage Details */}
                      {patient.triage_priority !== 'Not triaged' && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: `rgba(${patient.triage_level === 1 ? '220,53,69' : patient.triage_level === 2 ? '253,126,20' : patient.triage_level === 3 ? '255,193,7' : '40,167,69'}, 0.1)`,
                          borderRadius: '8px',
                          borderLeft: `4px solid ${getLevelColor(patient.triage_level)}`
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#e8edf5' }}>
                            Triage: {patient.triage_priority} • Department: {patient.triage_department}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            {patient.triage_reason}
                          </div>
                          {patient.triage_recommendation && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              💡 {patient.triage_recommendation}
                            </div>
                          )}
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
            onClick={() => setShowDashboard(true)}
            className="agent-dashboard-btn"
            style={{ 
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
              padding: '14px 36px',
              borderRadius: '14px',
              color: 'white',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            📊 Open Full Dashboard →
          </button>
          
          <button
            onClick={() => {
              fetchSentinelData();
              fetchPatients();
            }}
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
          {['Risk Detection & Assessment', 'Severity Score Calculation', 'Priority Level Assignment', 'Emergency Alert Generation'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(255,107,107,0.2)' }}>
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