import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestInstructionsModal from './TestInstructionsModal';
import emptyStateImg from '../../assets/empty-bee.png';

const CodeArenaList: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tests').catch(() => null);
      if (response && response.ok) {
        const apiTests = await response.json();
        setTests(apiTests.filter((t: any) => t.test_type === 'code' && t.is_published));
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    if (selectedTest) navigate(`/student/take-code/${selectedTest.id}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--student-text-muted)', padding: '40px 0' }}>
        <div style={{
          width: '20px', height: '20px', border: '3px solid var(--student-border)',
          borderTopColor: 'var(--student-accent-code)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        Loading Arenas...
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(79,70,229,0.05))',
            border: '1px solid rgba(79,70,229,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
          }}>💻</div>
          <div>
            <h1 style={{
              fontSize: '32px', fontWeight: 800, color: 'var(--student-text)',
              margin: 0, letterSpacing: '-1px'
            }}>Code Arenas</h1>
            <p style={{ color: 'var(--student-text-muted)', margin: 0, fontSize: '14px', marginTop: '2px' }}>
              Solve real-world coding challenges in our interactive IDE
            </p>
          </div>
        </div>
        <div style={{
          height: '3px', width: '80px',
          background: 'linear-gradient(90deg, #4F46E5, rgba(79,70,229,0))',
          borderRadius: '2px', marginTop: '4px'
        }} />
      </div>

      {tests.length === 0 ? (
        <div style={{
          background: 'var(--student-card-bg)', borderRadius: '20px',
          padding: '72px 40px', maxWidth: '560px', margin: '40px auto',
          textAlign: 'center', border: '1px solid var(--student-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <img src={emptyStateImg} alt="No coding arenas" style={{ width: '160px', height: 'auto', marginBottom: '28px', opacity: 0.85 }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--student-text)', margin: '0 0 10px' }}>
            No coding tests available yet
          </h2>
          <p style={{ color: 'var(--student-text-muted)', margin: 0, fontSize: '14px' }}>
            Check back later — your next real-world problem is coming soon.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {tests.map(test => (
            <div
              key={test.id}
              style={{
                background: 'var(--student-card-bg)',
                border: '1px solid var(--student-border)',
                borderRadius: '16px', padding: '24px',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#4F46E5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--student-border)';
              }}
            >
              {/* Top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                background: 'linear-gradient(90deg, #4F46E5, #818CF8)'
              }} />

              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <h3 style={{
                  margin: 0, fontSize: '18px', fontWeight: 800,
                  color: 'var(--student-text)', lineHeight: 1.3, letterSpacing: '-0.3px',
                  flex: 1, paddingRight: '12px'
                }}>{test.title}</h3>
                <span style={{
                  padding: '4px 12px', background: 'rgba(79,70,229,0.1)',
                  color: '#818CF8', borderRadius: '20px', fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  border: '1px solid rgba(79,70,229,0.25)', whiteSpace: 'nowrap'
                }}>Code</span>
              </div>

              <p style={{
                color: 'var(--student-text-muted)', fontSize: '14px',
                marginBottom: '20px', flex: 1, lineHeight: 1.65
              }}>
                {test.description || 'Test your coding skills by solving real-world problems in our interactive code IDE.'}
              </p>

              {/* Meta row */}
              <div style={{
                display: 'flex', gap: '12px', marginBottom: '20px',
                padding: '14px 16px', background: 'var(--student-bg)',
                borderRadius: '10px', border: '1px solid var(--student-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'var(--student-card-bg)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', border: '1px solid var(--student-border)'
                  }}>⏱️</div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--student-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
                    <div style={{ fontSize: '15px', color: 'var(--student-text)', fontWeight: 800 }}>
                      {test.duration_minutes} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--student-text-muted)' }}>mins</span>
                    </div>
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--student-border)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'var(--student-card-bg)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', border: '1px solid var(--student-border)'
                  }}>🧩</div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--student-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Problems</div>
                    <div style={{ fontSize: '15px', color: 'var(--student-text)', fontWeight: 800 }}>
                      {test.problem_count || 1} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--student-text-muted)' }}>item{(test.problem_count || 1) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setSelectedTest(test)}
                style={{
                  width: '100%', padding: '14px',
                  background: '#0F172A', color: 'white',
                  border: 'none', borderRadius: '10px',
                  fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                  letterSpacing: '0.3px', transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(79,70,229,0.35)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#0F172A';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                Enter Arena →
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedTest && (
        <TestInstructionsModal
          testType="Code"
          testTitle={selectedTest.title}
          onStart={handleStartTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
};

export default CodeArenaList;
