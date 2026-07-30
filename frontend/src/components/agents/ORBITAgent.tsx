import React, { useState, useEffect } from 'react';

interface Appointment {
  id: number;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  doctor_name: string;
  department: string;
  urgency: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface OrbitData {
  agent: string;
  status: string;
  total_appointments: number;
  appointments: Appointment[];
  message: string;
}

// Coimbatore Hospitals Mapping
const hospitalMap: Record<string, { 
  name: string; 
  address: string; 
  phone: string; 
  email: string; 
  color: string; 
  lat: number; 
  lng: number;
  mapLink: string;
  specialties: string[];
}> = {
  "Dr. Singh": {
    name: "Apollo Hospitals, Coimbatore",
    address: "Avinashi Road, Near Airport, Coimbatore - 641014",
    phone: "+91 422 1234 567",
    email: "appointments@apollocoimbatore.com",
    color: "#e74c3c",
    lat: 11.0307,
    lng: 77.0413,
    mapLink: "https://www.google.com/maps?q=Apollo+Hospitals+Coimbatore",
    specialties: ["Orthopedics", "Cardiology", "Neurology"]
  },
  "Dr. Patel": {
    name: "Kovai Medical Center & Hospital (KMCH)",
    address: "Avinashi Road, Peelamedu, Coimbatore - 641014",
    phone: "+91 422 432 3232",
    email: "appointments@kmchhospitals.com",
    color: "#2c3e50",
    lat: 11.0207,
    lng: 77.0433,
    mapLink: "https://www.google.com/maps?q=KMCH+Coimbatore",
    specialties: ["Cardiology", "Neurology", "Oncology"]
  },
  "Dr. Rao": {
    name: "PSG Hospitals, Coimbatore",
    address: "Peelamedu, Coimbatore - 641004",
    phone: "+91 422 257 0170",
    email: "appointments@psghospitals.com",
    color: "#2980b9",
    lat: 11.0212,
    lng: 77.0313,
    mapLink: "https://www.google.com/maps?q=PSG+Hospitals+Coimbatore",
    specialties: ["General Medicine", "Surgery", "Pediatrics"]
  },
  "Dr. Sharma": {
    name: "Ganga Medical Centre & Hospitals",
    address: "100 Feet Road, Coimbatore - 641012",
    phone: "+91 422 223 1900",
    email: "appointments@gangahealth.com",
    color: "#27ae60",
    lat: 11.0187,
    lng: 77.0223,
    mapLink: "https://www.google.com/maps?q=Ganga+Medical+Centre+Coimbatore",
    specialties: ["Orthopedics", "Trauma", "Sports Medicine"]
  },
  "Dr. Mehta": {
    name: "Sri Ramakrishna Hospital",
    address: "395, Sarojini Naidu Road, Coimbatore - 641044",
    phone: "+91 422 450 0000",
    email: "appointments@sriramakrishnahospital.com",
    color: "#8e44ad",
    lat: 11.0157,
    lng: 76.9993,
    mapLink: "https://www.google.com/maps?q=Sri+Ramakrishna+Hospital+Coimbatore",
    specialties: ["Cardiology", "Neurology", "Urology"]
  },
  "Dr. Gupta": {
    name: "Royal Care Super Speciality Hospital",
    address: "Neelambur, Coimbatore - 641014",
    phone: "+91 422 668 8000",
    email: "appointments@royalcarehospitals.com",
    color: "#f39c12",
    lat: 11.0407,
    lng: 77.0113,
    mapLink: "https://www.google.com/maps?q=Royal+Care+Hospital+Coimbatore",
    specialties: ["Cardiology", "Gastroenterology", "Nephrology"]
  },
  "Dr. Reddy": {
    name: "Aravind Eye Hospital, Coimbatore",
    address: "Avinashi Road, Coimbatore - 641014",
    phone: "+91 422 435 2150",
    email: "appointments@aravind.org",
    color: "#c0392b",
    lat: 11.0307,
    lng: 77.0513,
    mapLink: "https://www.google.com/maps?q=Aravind+Eye+Hospital+Coimbatore",
    specialties: ["Ophthalmology", "Eye Surgery", "Vision Care"]
  },
  "Dr. Joshi": {
    name: "Sankara Eye Hospital, Coimbatore",
    address: "Sivanandapuram, Coimbatore - 641035",
    phone: "+91 422 266 0011",
    email: "appointments@sankaraeye.com",
    color: "#16a085",
    lat: 11.0107,
    lng: 77.0013,
    mapLink: "https://www.google.com/maps?q=Sankara+Eye+Hospital+Coimbatore",
    specialties: ["Ophthalmology", "Retina Surgery", "Cataract"]
  },
  "Dr. Kumar": {
    name: "KG Hospital, Coimbatore",
    address: "Arts College Road, Coimbatore - 641018",
    phone: "+91 422 221 2121",
    email: "appointments@kghospital.com",
    color: "#2c3e50",
    lat: 11.0257,
    lng: 76.9813,
    mapLink: "https://www.google.com/maps?q=KG+Hospital+Coimbatore",
    specialties: ["Cardiology", "Neurology", "Orthopedics"]
  }
};

const getUrgencyColor = (urgency: string): string => {
  const colors: Record<string, string> = {
    'emergency': '#dc3545',
    'urgent': '#fd7e14',
    'routine': '#ffc107',
    'information': '#28a745'
  };
  return colors[urgency] || '#6c757d';
};

const getUrgencyBadge = (urgency: string): string => {
  const badges: Record<string, string> = {
    'emergency': '🚨 EMERGENCY',
    'urgent': '🔴 URGENT',
    'routine': '🟡 ROUTINE',
    'information': '🟢 INFORMATION'
  };
  return badges[urgency] || '⚪ UNKNOWN';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'scheduled': '#ffc107',
    'confirmed': '#28a745',
    'completed': '#17a2b8',
    'cancelled': '#dc3545'
  };
  return colors[status] || '#6c757d';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const ORBITAgent: React.FC = () => {
  const [data, setData] = useState<OrbitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchOrbitData();
  }, []);

  const fetchOrbitData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/orbit');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching ORBIT data:', err);
      setError('Failed to load ORBIT dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">📅 Loading...</div>
          <h2 className="section-title">ORBIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#94a3b8' }}>Loading appointments...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="agent-dashboard">
        <div className="section-header">
          <div className="section-label">📅 Error</div>
          <h2 className="section-title">ORBIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={fetchOrbitData}
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
          <div className="section-label">📅 No Data</div>
          <h2 className="section-title">ORBIT</h2>
        </div>
        <div className="agent-dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#94a3b8' }}>No appointments available</p>
        </div>
      </section>
    );
  }

  const totalAppointments = data.total_appointments;
  const confirmed = data.appointments.filter(a => a.status === 'confirmed').length;
  const scheduled = data.appointments.filter(a => a.status === 'scheduled').length;
  const completed = data.appointments.filter(a => a.status === 'completed').length;

  return (
    <section className="agent-dashboard">
      <div className="section-header">
        <div className="section-label">📅 Operations Agent</div>
        <h2 className="section-title">ORBIT</h2>
        <p className="section-subtitle">Operational Resource & Booking Intelligent Tracker</p>
      </div>
      
      <div className="agent-dashboard-card">
        <div className="agent-dashboard-icon">📅</div>
        <h3>Appointment Dashboard</h3>
        <p>Real-time appointment scheduling and resource management</p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          margin: '16px 0 24px'
        }}>
          <div style={{ background: 'rgba(148,163,184,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#e8edf5' }}>{totalAppointments}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Appointments</div>
          </div>
          <div style={{ background: 'rgba(255,193,7,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,193,7,0.2)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffc107' }}>{scheduled}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Scheduled</div>
          </div>
          <div style={{ background: 'rgba(40,167,69,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.2)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#28a745' }}>{confirmed}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Confirmed</div>
          </div>
          <div style={{ background: 'rgba(23,162,184,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(23,162,184,0.2)' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#17a2b8' }}>{completed}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Completed</div>
          </div>
        </div>

        {/* Appointments List */}
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: '#e8edf5', marginBottom: '16px', fontSize: '16px' }}>
            📋 Appointment List ({totalAppointments})
          </h4>
          
          {data.appointments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(148,163,184,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.06)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#e8edf5', marginBottom: '8px' }}>
                No Hospital Visit Needed
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                Your condition can be managed with medication or home remedies.
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                💡 Please visit the <strong style={{ color: '#00f5d4' }}>MEDIX</strong> agent for medicine suggestions.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.appointments.map((appointment) => {
                const hospital = hospitalMap[appointment.doctor_name] || {
                  name: 'Coimbatore Medical College Hospital',
                  address: 'Trichy Road, Coimbatore - 641018',
                  phone: '+91 422 230 0000',
                  email: 'appointments@cmch.gov.in',
                  color: '#6c757d',
                  lat: 11.0007,
                  lng: 77.0013,
                  mapLink: 'https://www.google.com/maps?q=Coimbatore+Medical+College',
                  specialties: ['General Medicine', 'Emergency']
                };
                const urgencyColor = getUrgencyColor(appointment.urgency);
                const statusColor = getStatusColor(appointment.status);
                const isSelected = selectedAppointment?.id === appointment.id;

                return (
                  <div
                    key={appointment.id}
                    style={{
                      background: isSelected ? 'rgba(68,234,187,0.05)' : 'rgba(148,163,184,0.03)',
                      border: isSelected ? `1px solid ${hospital.color}` : '1px solid rgba(148,163,184,0.08)',
                      borderRadius: '16px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedAppointment(isSelected ? null : appointment)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = hospital.color;
                        e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.2)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Hospital Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>🏥</span>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: hospital.color }}>
                            {hospital.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{hospital.address}</div>
                        </div>
                      </div>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'white',
                          background: urgencyColor
                        }}>
                          {getUrgencyBadge(appointment.urgency)}
                        </span>
                      </div>
                    </div>

                    {/* Doctor & Department */}
                    <div style={{ marginTop: '12px', padding: '12px 0', borderTop: '1px solid rgba(148,163,184,0.06)', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '20px' }}>👨‍⚕️</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#e8edf5' }}>
                          {appointment.doctor_name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                          🏛️ {appointment.department}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {hospital.specialties.join(' • ')}
                        </span>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>📅 Date</div>
                        <div style={{ fontSize: '14px', color: '#e8edf5', fontWeight: '500' }}>
                          {formatDate(appointment.appointment_date)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>⏰ Time</div>
                        <div style={{ fontSize: '14px', color: '#e8edf5', fontWeight: '500' }}>
                          {appointment.appointment_time}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>🆔 Patient ID</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {appointment.patient_id.slice(0, 16)}...
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>📋 Status</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: statusColor
                          }} />
                          <span style={{ fontSize: '13px', fontWeight: '500', color: statusColor, textTransform: 'capitalize' }}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(148,163,184,0.05)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>📝 Notes</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{appointment.notes}</div>
                      </div>
                    )}

                    {/* Expanded Map View */}
                    {isSelected && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'rgba(148,163,184,0.05)',
                        borderRadius: '12px',
                        borderTop: '1px solid rgba(148,163,184,0.08)',
                        animation: 'fadeIn 0.3s ease'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Map Embed */}
                          <div style={{
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#0a0f1a',
                            border: '1px solid rgba(148,163,184,0.08)'
                          }}>
                            <iframe
                              title="Hospital Location"
                              width="100%"
                              height="250"
                              style={{ border: 0 }}
                              loading="lazy"
                              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(hospital.name)}`}
                              allowFullScreen
                            />
                          </div>
                          
                          {/* Hospital Info */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📞 Phone
                              </div>
                              <div style={{ fontSize: '13px', color: '#e8edf5' }}>{hospital.phone}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                ✉️ Email
                              </div>
                              <div style={{ fontSize: '13px', color: '#e8edf5' }}>{hospital.email}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                📍 Location
                              </div>
                              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{hospital.address}</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <a
                              href={hospital.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(68,234,187,0.1)',
                                border: '1px solid rgba(68,234,187,0.2)',
                                borderRadius: '8px',
                                color: '#00f5d4',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.3s',
                                flex: 1,
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(68,234,187,0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(68,234,187,0.1)';
                              }}
                            >
                              🗺️ Open in Google Maps
                            </a>
                            <a
                              href={`tel:${hospital.phone}`}
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(68,234,187,0.05)',
                                border: '1px solid rgba(148,163,184,0.15)',
                                borderRadius: '8px',
                                color: '#94a3b8',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.3s',
                                flex: 1,
                                textAlign: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#00f5d4';
                                e.currentTarget.style.color = '#e8edf5';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              📞 Call Hospital
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expand Hint */}
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {isSelected ? '▼ Click to collapse map' : '▶ Click to view hospital location'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          <button
            onClick={fetchOrbitData}
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
          {['Doctor Availability', 'Appointment Booking', 'Department Routing', 'Bed Allocation'].map((item, i) => (
            <div key={i} className="agent-feature-item" style={{ borderColor: 'rgba(68,234,187,0.2)' }}>
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