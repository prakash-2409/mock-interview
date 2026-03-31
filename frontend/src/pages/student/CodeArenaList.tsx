import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestInstructionsModal from './TestInstructionsModal';
import emptyStateImg from '../../assets/empty-bee.png';

const CodeArenaList: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tests').catch(() => null);
      let apiTests = [];
      if (response && response.ok) {
        apiTests = await response.json();
      }

      setTests(apiTests.filter((t: any) => t.test_type === 'code' && t.is_published));
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    if (selectedTest) {
      navigate(`/student/take-code/${selectedTest.id}`);
    }
  };

  if (loading) return <div style={{color: 'var(--student-text)'}}>Loading Arenas...</div>;

  return (
    <div style={{ animation: "fadeIn 0.6s ease" }}>
      <div style={{ position: 'relative', marginBottom: '40px', display: 'inline-block' }}>
        <h1 style={{fontSize: '46px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-1.5px'}}>Code Arenas</h1>
        <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #FFC107 0%, rgba(255, 193, 7, 0) 100%)', borderRadius: '4px' }}></div>
      </div>
      
      {tests.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '60px 40px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          maxWidth: '600px',
          margin: '40px auto 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          border: '1px solid rgba(226, 232, 240, 0.5)'
        }}>
          <img 
            src={emptyStateImg} 
            alt="No coding arenas" 
            style={{ width: '180px', height: 'auto', marginBottom: '32px' }} 
          />
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.5px',
            margin: 0
          }}>
            No coding tests are currently available.
          </h2>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map(test => (
            <div key={test.id} className="test-card">
              <h3>{test.title}</h3>
              <p style={{color: '#a0a5b5', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '40px'}}>{test.description}</p>
              
              <div className="test-meta">
                <span>⏱ {test.duration_minutes} mins</span>
                <span>💻 {test.problem_count || 1} Problems</span>
              </div>
              
              <button className="btn-accent" onClick={() => setSelectedTest(test)}>
                Enter Arena
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
