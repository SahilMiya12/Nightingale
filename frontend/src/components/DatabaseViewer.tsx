import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TableData {
  columns: string[];
  rows: Record<string, any>[];
  count: number;
}

interface DatabaseData {
  tables: Record<string, TableData>;
  error?: string;
}

export const DatabaseViewer: React.FC = () => {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleTables, setVisibleTables] = useState<string[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollPositionRef = useRef<number>(0);
  const isClickingTableRef = useRef<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/database/view');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
        const tableNames = Object.keys(result.tables);
        setVisibleTables(tableNames);
        if (tableNames.length > 0) {
          setSelectedTable(tableNames[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching database:', err);
      setError('Failed to load database data');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') {
      if (value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      return value;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).substring(0, 100);
      } catch {
        return '—';
      }
    }
    return String(value);
  };

  const getTableColor = (tableName: string): string => {
    const colors: Record<string, string> = {
      'patients': '#6366f1',
      'collected_info': '#00f5d4',
      'triage_results': '#ff6b6b',
      'conversations': '#fbbf24',
      'clarity_summaries': '#4d9de0',
      'orbit_schedules': '#44eabb',
      'medix_validations': '#ff6b9d',
      'carelink_followups': '#ff8566'
    };
    return colors[tableName] || '#94a3b8';
  };

  const getStatusColor = (value: any): string => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('emergency') || lower.includes('critical')) return '#ef4444';
      if (lower.includes('high')) return '#f59e0b';
      if (lower.includes('medium') || lower.includes('routine')) return '#fbbf24';
      if (lower.includes('low') || lower.includes('information')) return '#22c55e';
      if (lower.includes('resolved') || lower.includes('completed')) return '#22c55e';
    }
    return '#94a3b8';
  };

  const getRowColor = (index: number): string => {
    return index % 2 === 0 ? 'rgba(148,163,184,0.02)' : 'rgba(148,163,184,0.05)';
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleTableClick = useCallback((tableName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const container = tableContainerRef.current;
    if (container) {
      scrollPositionRef.current = container.scrollTop;
      isClickingTableRef.current = true;
    }
    
    setSelectedTable(tableName);
    
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = scrollPositionRef.current;
        let attempts = 0;
        const interval = setInterval(() => {
          if (container.scrollTop !== scrollPositionRef.current) {
            container.scrollTop = scrollPositionRef.current;
          }
          attempts++;
          if (attempts > 10 || !isClickingTableRef.current) {
            clearInterval(interval);
            isClickingTableRef.current = false;
          }
        }, 50);
      }
    });
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const preventScrollOnClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tableHeader = target.closest('[data-table-header="true"]');
      if (tableHeader) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const currentScroll = container.scrollTop;
        scrollPositionRef.current = currentScroll;
        
        const lockScroll = () => {
          if (container.scrollTop !== scrollPositionRef.current) {
            container.scrollTop = scrollPositionRef.current;
          }
        };
        
        const scrollHandler = () => lockScroll();
        container.addEventListener('scroll', scrollHandler);
        
        const wheelHandler = (ev: WheelEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          lockScroll();
        };
        container.addEventListener('wheel', wheelHandler, { passive: false });
        
        let count = 0;
        const lockInterval = setInterval(() => {
          lockScroll();
          count++;
          if (count > 20) {
            clearInterval(lockInterval);
            container.removeEventListener('scroll', scrollHandler);
            container.removeEventListener('wheel', wheelHandler);
          }
        }, 30);
        
        setTimeout(() => {
          isClickingTableRef.current = false;
        }, 500);
      }
    };

    container.addEventListener('click', preventScrollOnClick, true);
    container.addEventListener('mousedown', preventScrollOnClick, true);
    
    return () => {
      container.removeEventListener('click', preventScrollOnClick, true);
      container.removeEventListener('mousedown', preventScrollOnClick, true);
    };
  }, []);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const monitorScroll = () => {
      if (isClickingTableRef.current) {
        container.scrollTop = scrollPositionRef.current;
        return;
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const tableElements = Array.from(tableRefs.current.values());
        const visible: string[] = [];
        
        tableElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
            const tableName = element.getAttribute('data-table-name');
            if (tableName) visible.push(tableName);
          }
        });
        
        setVisibleTables(visible);
      }, 150);
    };

    container.addEventListener('scroll', monitorScroll);
    
    const preventWheel = (e: WheelEvent) => {
      if (isClickingTableRef.current) {
        e.preventDefault();
        e.stopPropagation();
        container.scrollTop = scrollPositionRef.current;
      }
    };
    container.addEventListener('wheel', preventWheel, { passive: false });
    
    return () => {
      container.removeEventListener('scroll', monitorScroll);
      container.removeEventListener('wheel', preventWheel);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(148,163,184,0.1)',
          borderTop: '3px solid #00f5d4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <div style={{ color: '#94a3b8', fontSize: '16px' }}>Loading database...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
        <div style={{ color: '#ef4444', fontSize: '18px', marginBottom: '16px' }}>{error}</div>
        <button
          onClick={fetchData}
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #4d9de0)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.tables) {
    return (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
        <div style={{ color: '#94a3b8', fontSize: '16px' }}>No data found</div>
      </div>
    );
  }

  const tableNames = Object.keys(data.tables);
  const filteredTableNames = tableNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 80px)',
      marginTop: '80px',
      background: '#06080d',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '280px',
        minWidth: '280px',
        height: '100%',
        borderRight: '1px solid rgba(148,163,184,0.08)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(6,8,13,0.95)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(148,163,184,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h3 style={{
              color: '#e8edf5',
              fontSize: '16px',
              fontWeight: '700',
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              🗄️ Database
            </h3>
            <span style={{
              color: '#64748b',
              fontSize: '12px',
              background: 'rgba(148,163,184,0.1)',
              padding: '4px 12px',
              borderRadius: '12px'
            }}>
              {Object.keys(data.tables).length} tables
            </span>
          </div>
          <div style={{
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                paddingLeft: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.15)',
                background: 'rgba(148,163,184,0.05)',
                color: '#e8edf5',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.background = 'rgba(148,163,184,0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)';
                e.currentTarget.style.background = 'rgba(148,163,184,0.05)';
              }}
            />
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              fontSize: '16px'
            }}>
              🔍
            </span>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px 20px'
        }}>
          {filteredTableNames.map(name => {
            const isActive = selectedTable === name;
            const isVisible = visibleTables.includes(name);
            const color = getTableColor(name);
            const count = data.tables[name].count;

            return (
              <button
                key={name}
                onClick={(e) => handleTableClick(name, e)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive
                    ? `rgba(${color}, 0.12)`
                    : 'transparent',
                  color: isActive ? '#e8edf5' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isVisible ? color : 'rgba(148,163,184,0.2)',
                    flexShrink: 0,
                    transition: 'all 0.3s'
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {name}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: isActive ? 'rgba(255,255,255,0.4)' : '#64748b',
                  background: isActive ? `rgba(${color}, 0.2)` : 'rgba(148,163,184,0.08)',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(148,163,184,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: '#64748b',
            fontSize: '12px'
          }}>
            {tableNames.length} tables
          </span>
          <button
            onClick={fetchData}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
            🔄 Refresh
          </button>
        </div>
      </div>

      <div 
        ref={tableContainerRef} 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px 40px',
          height: '100%',
          position: 'relative'
        }}
        className="database-scroll-container"
      >
        <style>{`
          .database-scroll-container {
            scroll-behavior: auto !important;
          }
          .database-scroll-container * {
            scroll-behavior: auto !important;
          }
        `}</style>
        
        {filteredTableNames.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '16px' }}>No tables found matching "{searchTerm}"</div>
          </div>
        ) : (
          filteredTableNames.map(name => {
            const tableData = data.tables[name];
            const color = getTableColor(name);
            const isSelected = selectedTable === name;

            return (
              <div
                key={name}
                ref={(el) => {
                  if (el) {
                    tableRefs.current.set(name, el);
                    el.setAttribute('data-table-name', name);
                  }
                }}
                style={{
                  marginBottom: '24px',
                  background: 'rgba(18,24,38,0.6)',
                  borderRadius: '16px',
                  border: isSelected 
                    ? `2px solid ${color}`
                    : '1px solid rgba(148,163,184,0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div 
                  data-table-header="true"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    
                    const container = tableContainerRef.current;
                    if (container) {
                      scrollPositionRef.current = container.scrollTop;
                      isClickingTableRef.current = true;
                    }
                    
                    setSelectedTable(isSelected ? null : name);
                    
                    // Use the same container reference
                    if (container) {
                      let lockCount = 0;
                      const maxLocks = 30;
                      const lockInterval = setInterval(() => {
                        if (container.scrollTop !== scrollPositionRef.current) {
                          container.scrollTop = scrollPositionRef.current;
                        }
                        lockCount++;
                        if (lockCount >= maxLocks) {
                          clearInterval(lockInterval);
                          isClickingTableRef.current = false;
                        }
                      }, 20);
                      
                      requestAnimationFrame(() => {
                        container.scrollTop = scrollPositionRef.current;
                      });
                      
                      setTimeout(() => {
                        container.scrollTop = scrollPositionRef.current;
                      }, 100);
                    }
                  }}
                  style={{
                    padding: '16px 24px',
                    background: isSelected 
                      ? `linear-gradient(135deg, rgba(${color}, 0.12), rgba(${color}, 0.04))`
                      : 'rgba(148,163,184,0.02)',
                    borderBottom: isSelected ? `1px solid rgba(${color}, 0.2)` : '1px solid rgba(148,163,184,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isSelected 
                      ? `linear-gradient(135deg, rgba(${color}, 0.15), rgba(${color}, 0.06))`
                      : 'rgba(148,163,184,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected 
                      ? `linear-gradient(135deg, rgba(${color}, 0.12), rgba(${color}, 0.04))`
                      : 'rgba(148,163,184,0.02)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '4px',
                      height: '32px',
                      borderRadius: '2px',
                      background: color,
                      transition: 'all 0.3s ease'
                    }} />
                    <div>
                      <h3 style={{
                        color: isSelected ? color : '#e8edf5',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: 0,
                        fontFamily: 'JetBrains Mono, monospace',
                        transition: 'color 0.3s ease'
                      }}>
                        {name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '4px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {tableData.columns.length} columns
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {tableData.count} rows
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#94a3b8'
                    }}>
                      {tableData.count > 0 ? `Showing ${Math.min(tableData.count, 50)} rows` : 'Empty'}
                    </span>
                    <span style={{
                      color: isSelected ? color : '#64748b',
                      fontSize: '18px',
                      transition: 'all 0.3s ease',
                      transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                <div style={{
                  maxHeight: isSelected ? '600px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{
                    overflowX: 'auto',
                    height: isSelected ? 'auto' : '0',
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}>
                    {tableData.count === 0 ? (
                      <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#64748b'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                        <div>No data in this table</div>
                      </div>
                    ) : (
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        <thead>
                          <tr style={{
                            background: 'rgba(148,163,184,0.05)',
                            borderBottom: '2px solid rgba(148,163,184,0.08)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10
                          }}>
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              color: '#94a3b8',
                              fontWeight: '600',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              width: '40px'
                            }}>
                              #
                            </th>
                            {tableData.columns.map(col => (
                              <th key={col} style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                color: '#94a3b8',
                                fontWeight: '600',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                                minWidth: col.includes('id') ? '150px' : '100px'
                              }}>
                                {col}
                              </th>
                            ))}
                            <th style={{
                              padding: '12px 16px',
                              textAlign: 'center',
                              color: '#94a3b8',
                              fontWeight: '600',
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              width: '40px'
                            }}>
                              🔍
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.slice(0, 50).map((row, index) => {
                            const isExpanded = expandedRows.has(index);
                            const rowBg = getRowColor(index);

                            return (
                              <React.Fragment key={index}>
                                <tr style={{
                                  borderBottom: '1px solid rgba(148,163,184,0.04)',
                                  background: rowBg,
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(148,163,184,0.06)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = rowBg;
                                }}
                                >
                                  <td style={{
                                    padding: '10px 16px',
                                    color: '#64748b',
                                    fontSize: '12px',
                                    fontFamily: 'JetBrains Mono, monospace'
                                  }}>
                                    {index + 1}
                                  </td>
                                  {tableData.columns.map(col => {
                                    const value = row[col];
                                    const formatted = formatValue(value);
                                    const isId = col.includes('id') || col === 'patient_id';
                                    const isStatus = col.includes('status') || col.includes('priority');
                                    
                                    let color = '#94a3b8';
                                    if (isId) color = '#818cf8';
                                    if (isStatus) color = getStatusColor(value);
                                    if (col.includes('created_at') || col.includes('updated_at')) {
                                      color = '#64748b';
                                    }

                                    return (
                                      <td key={col} style={{
                                        padding: '10px 16px',
                                        color: color,
                                        fontSize: '12px',
                                        fontFamily: isId ? 'JetBrains Mono, monospace' : 'Inter, system-ui, sans-serif',
                                        maxWidth: '300px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        position: 'relative'
                                      }}>
                                        {formatted}
                                        {typeof value === 'string' && value.length > 100 && (
                                          <span style={{
                                            position: 'absolute',
                                            right: '4px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#64748b',
                                            fontSize: '10px'
                                          }}>
                                            …
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td style={{
                                    padding: '10px 16px',
                                    textAlign: 'center'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRowExpansion(index);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'transform 0.2s',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        padding: '4px'
                                      }}
                                    >
                                      ▼
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={tableData.columns.length + 2} style={{
                                      padding: '16px 20px',
                                      background: 'rgba(148,163,184,0.03)',
                                      borderBottom: '1px solid rgba(148,163,184,0.04)'
                                    }}>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '8px'
                                      }}>
                                        {tableData.columns.map(col => {
                                          const value = row[col];
                                          const formatted = formatValue(value);
                                          return (
                                            <div key={col} style={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              padding: '8px 12px',
                                              background: 'rgba(148,163,184,0.05)',
                                              borderRadius: '8px'
                                            }}>
                                              <span style={{
                                                fontSize: '10px',
                                                color: '#64748b',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: '600'
                                              }}>
                                                {col}
                                              </span>
                                              <span style={{
                                                fontSize: '13px',
                                                color: '#e8edf5',
                                                marginTop: '4px',
                                                wordBreak: 'break-word'
                                              }}>
                                                {formatted}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                    {tableData.count > 50 && (
                      <div style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '13px',
                        borderTop: '1px solid rgba(148,163,184,0.04)'
                      }}>
                        Showing 50 of {tableData.count} rows
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.05);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 4px;
          transition: background 0.2s;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.3);
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) rgba(148, 163, 184, 0.05);
        }
        .database-scroll-container,
        .database-scroll-container * {
          scroll-behavior: auto !important;
        }
      `}</style>
    </div>
  );
};