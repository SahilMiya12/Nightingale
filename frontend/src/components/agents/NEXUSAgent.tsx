import React, { useState, useEffect } from 'react';

interface NexusRecord {
  id: number;
  patient_id: string;
  unified_record: string;
  medical_history: string;
  allergies: string;
  chronic_conditions: string;
  past_surgeries: string;
  family_history: string;
  lifestyle_factors: string;
  created_at: string;
  updated_at: string;
}

interface NexusData {
  agent: string;
  status: string;
  total_records: number;
  records: NexusRecord[];
  message: string;
}

// Helper function to extract info from unified_record
const extractFromRecord = (record: NexusRecord) => {
  const text = record.unified_record || '';
  
  // Extract symptom
  const symptomMatch = text.match(/PRIMARY SYMPTOM: (.*?)(?:\n|$)/i);
  const symptom = symptomMatch ? symptomMatch[1].trim() : 'Unknown';
  
  // Extract triage priority
  const priorityMatch = text.match(/TRIAGE PRIORITY: (.*?)(?:\n|$)/i);
  const priority = priorityMatch ? priorityMatch[1].trim() : 'Unknown';
  
  // Extract department
  const deptMatch = text.match(/RECOMMENDED DEPARTMENT: (.*?)(?:\n|$)/i);
  const department = deptMatch ? deptMatch[1].trim() : 'General Medicine';
  
  return { symptom, priority, department };
};

export const NEXUSAgent: React.FC = () => {
  const [data, setData] = useState<NexusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<NexusRecord | null>(null);

  useEffect(() => {
    fetchNexusData();
  }, []);

  const fetchNexusData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/nexus');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching NEXUS data:', err);
      setError('Failed to load NEXUS dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (priority: string): number => {
    if (priority.includes('EMERGENCY')) return 1;
    if (priority.includes('HIGH')) return 2;
    if (priority.includes('ROUTINE')) return 3;
    return 4;
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

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🗄️ Loading...</div>
          <h2 className="section-title">NEXUS</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading NEXUS records...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">🗄️ Error</div>
          <h2 className="section-title">NEXUS</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchNexusData}
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
          <div className="section-label">🗄️ No Data</div>
          <h2 className="section-title">NEXUS</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No NEXUS records available</p>
        </div>
      </section>
    );
  }

  // Calculate stats from records
  let highPriorityCount = 0;
  let routineCount = 0;
  data.records.forEach(record => {
    const { priority } = extractFromRecord(record);
    if (priority.includes('EMERGENCY') || priority.includes('HIGH')) {
      highPriorityCount++;
    } else if (priority.includes('ROUTINE') || priority.includes('INFORMATION')) {
      routineCount++;
    }
  });

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">🗄️ Records Agent</div>
        <h2 className="section-title">NEXUS</h2>
        <p className="section-subtitle">Networked Electronic eXchange for Unified Storage</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">🗄️</div>
        <h3>Medical Records</h3>
        <p>Unified patient records and medical history</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6c5ce7' }}>{data.total_records}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Records</div>
          </div>
          <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{highPriorityCount}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 High Priority</div>
          </div>
          <div style={{ background: 'rgba(255,193,7,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,193,7,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>{routineCount}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🟡 Routine</div>
          </div>
        </div>

        {/* Records List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Patient Records ({data.total_records})
          </h4>
          
          {data.records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No patient records found
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.records.slice(0, 10).map((record, index) => {
                const { symptom, priority, department } = extractFromRecord(record);
                const level = getPriorityLevel(priority);
                
                return (
                  <div
                    key={index}
                    style={{
                      background: selectedRecord?.id === record.id 
                        ? 'rgba(108,92,231,0.1)' 
                        : 'rgba(148,163,184,0.03)',
                      border: selectedRecord?.id === record.id
                        ? '1px solid rgba(108,92,231,0.3)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setSelectedRecord(
                      selectedRecord?.id === record.id ? null : record
                    )}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e8edf5' }}>
                            {record.patient_id.slice(0, 16)}...
                          </span>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                            color: 'white',
                            background: getLevelColor(level)
                          }}>
                            {priority}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          🩺 {symptom} • 📍 {department}
                        </div>
                      </div>
                      <div style={{ fontSize: '20px' }}>🗄️</div>
                    </div>

                    {/* Expanded Record Details */}
                    {selectedRecord?.id === record.id && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'rgba(148,163,184,0.05)',
                        borderRadius: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📋 Unified Record</div>
                          <div style={{ fontSize: '13px', color: '#e8edf5', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                            {record.unified_record}
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>💊 Allergies</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{record.allergies}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>🔄 Chronic Conditions</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{record.chronic_conditions}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>🔪 Past Surgeries</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{record.past_surgeries}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>👨‍👩‍👧‍👦 Family History</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{record.family_history}</div>
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
            onClick={fetchNexusData}
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
          {['Patient History', 'Lab Reports', 'Visit Records', 'Medical Timeline'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(108,92,231,0.2)' }}>
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