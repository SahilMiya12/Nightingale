import React, { useState, useEffect } from 'react';

interface DoctorReview {
  id: number;
  patient_id: string;
  triage_level: number;
  triage_priority: string;
  symptom: string;
  severity: string;
  review_status: string;
  doctor_notes: string;
  action_taken: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

interface DoctorStats {
  total: number;
  by_status: Record<string, number>;
  pending_emergency: number;
}

interface DoctorData {
  agent: string;
  status: string;
  stats: DoctorStats;
  reviews: DoctorReview[];
  message: string;
}

export const DOCTOR_Agent: React.FC = () => {
  const [data, setData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<DoctorReview | null>(null);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/doctor');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching DOCTOR data:', err);
      setError('Failed to load DOCTOR dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending': '#ffc107',
      'completed': '#28a745',
      'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getPriorityColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: '#dc3545',
      2: '#fd7e14',
      3: '#ffc107',
      4: '#28a745'
    };
    return colors[level] || '#6c757d';
  };

  const getPriorityLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: '🚨 EMERGENCY',
      2: '🔴 HIGH',
      3: '🟡 ROUTINE',
      4: '🟢 INFORMATION'
    };
    return labels[level] || 'UNKNOWN';
  };

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return 'Not reviewed yet';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">👨‍⚕️ Loading...</div>
          <h2 className="section-title">HUMAN-IN-THE-LOOP</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading doctor reviews...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">👨‍⚕️ Error</div>
          <h2 className="section-title">HUMAN-IN-THE-LOOP</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchDoctorData}
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
          <div className="section-label">👨‍⚕️ No Data</div>
          <h2 className="section-title">HUMAN-IN-THE-LOOP</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No doctor reviews available</p>
        </div>
      </section>
    );
  }

  const stats = data.stats || { total: 0, by_status: {}, pending_emergency: 0 };
  const totalReviews = stats.total || 0;
  const pendingCount = stats.by_status?.pending || 0;
  const completedCount = stats.by_status?.completed || 0;
  const pendingEmergency = stats.pending_emergency || 0;

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">👨‍⚕️ Doctor Agent</div>
        <h2 className="section-title">HUMAN-IN-THE-LOOP</h2>
        <p className="section-subtitle">Human-in-the-Loop: Only for emergencies & appointment confirmation</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">👨‍⚕️</div>
        <h3>Doctor Review</h3>
        <p>Human-in-the-loop for emergencies and appointment confirmation</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '16px 0 20px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>{totalReviews}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Reviews</div>
          </div>
          <div style={{ background: 'rgba(255,193,7,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,193,7,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>{pendingCount}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>⏳ Pending</div>
          </div>
          <div style={{ background: 'rgba(40,167,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>{completedCount}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>✅ Completed</div>
          </div>
          <div style={{ background: 'rgba(220,53,69,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(220,53,69,0.2)' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc3545' }}>{pendingEmergency}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>🚨 Emergency Pending</div>
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '12px', fontSize: '14px' }}>
            📋 Doctor Reviews ({data.reviews.length})
          </h4>
          
          {data.reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No doctor reviews found
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {data.reviews.slice(0, 10).map((review) => {
                const statusColor = getStatusColor(review.review_status);
                const priorityColor = getPriorityColor(review.triage_level);
                const isSelected = selectedReview?.id === review.id;

                return (
                  <div
                    key={review.id}
                    style={{
                      background: isSelected ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.03)',
                      border: isSelected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setSelectedReview(isSelected ? null : review)}
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
                          background: priorityColor
                        }}>
                          {getPriorityLabel(review.triage_level)}
                        </span>
                        <span style={{ fontSize: '13px', color: '#e8edf5' }}>
                          {review.symptom || 'Unknown symptom'}
                        </span>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          background: statusColor
                        }}>
                          {review.review_status.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatTimestamp(review.created_at)}
                      </span>
                    </div>

                    {/* Expanded Review Details */}
                    {isSelected && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        background: 'rgba(148,163,184,0.05)',
                        borderRadius: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>🆔 Patient ID</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              {review.patient_id.slice(0, 16)}...
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>📊 Severity</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {review.severity || 'Not recorded'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>📋 Triage Level</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {review.triage_level} - {getPriorityLabel(review.triage_level)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>👨‍⚕️ Reviewed By</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {review.reviewed_by || 'Not assigned yet'}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Doctor Notes</div>
                          <div style={{ fontSize: '13px', color: '#e8edf5', marginTop: '4px', background: 'rgba(148,163,184,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                            {review.doctor_notes || 'No notes available'}
                          </div>
                        </div>

                        {review.action_taken && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>✅ Action Taken</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                              {review.action_taken}
                            </div>
                          </div>
                        )}

                        {review.reviewed_at && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                            Reviewed at: {formatTimestamp(review.reviewed_at)}
                          </div>
                        )}
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
            onClick={fetchDoctorData}
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
          {['Emergency Review', 'Appointment Confirmation', 'Human Oversight', 'Critical Decisions'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(46,204,113,0.2)' }}>
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