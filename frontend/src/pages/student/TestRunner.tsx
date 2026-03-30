import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAntiCheat } from './useAntiCheat';
import './student.css';

const TestRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Anti-Cheat Initialization
  const { enterFullscreen } = useAntiCheat({
    maxTabSwitches: 2,
    maxFullscreenEscapes: 2,
    onWarning: (reason, warningsLeft) => {
      setWarningMessage(`WARNING: ${reason} (Remaining warnings: ${warningsLeft})`);
      if (!reason.includes('full-screen')) {
         setTimeout(() => setWarningMessage(''), 5000); // Hide tab switch warnings after 5s
      }
    },
    onTerminate: async (reason) => {
      alert(`TEST TERMINATED: ${reason}`);
      await forceSubmit(0);
    }
  });

  useEffect(() => {
    fetchTest();
    enterFullscreen();
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tests/${id}`);
      const data = await response.json();
      if (response.ok) {
        setTest(data);
      } else {
        alert("Test not found");
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const forceSubmit = async (score: number) => {
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user) return;

      const payload = {
        test_id: parseInt(id || '0'),
        student_id: user._id,
        score: score,
        total_marks: test?.duration_minutes || 10, // Assuming total marks roughly
        status: 'completed'
      };

      await fetch('http://localhost:5000/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Auto exit fullscreen
      if (document.fullscreenElement) {
         document.exitFullscreen().catch(e => console.error(e));
      }
      navigate('/student');
      alert("Test Submitted successfully.");
    } catch(err) {
      console.error("Submit error", err);
      navigate('/student');
    }
  };

  const handleManualSubmit = () => {
     forceSubmit(Math.floor(Math.random() * 10) + 1); // Mock Score submission 
  };

  if (loading) return <div style={{ color: 'var(--student-text)', padding: '32px' }}>Loading secure environment...</div>;

  return (
    <div style={{ background: 'var(--student-bg)', minHeight: '100vh', color: 'var(--student-text)', margin: '-32px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Warning Overlay */}
      {warningMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '500px', border: '1px solid #334155' }}>
            <h2 style={{ color: '#ef4444', margin: '0 0 16px', fontSize: '28px', fontWeight: 'bold' }}>WARNING</h2>
            <p style={{ color: 'white', fontSize: '16px', lineHeight: '1.5', margin: '0 0 24px' }}>{warningMessage}</p>
            {warningMessage.includes('full-screen') && (
              <button 
                className="btn-accent" 
                style={{ backgroundColor: '#ef4444', border: 'none', width: '100%', padding: '12px' }}
                onClick={() => {
                  enterFullscreen();
                  setWarningMessage('');
                }}
              >
                Return to Full Screen
              </button>
            )}
          </div>
        </div>
      )}

      <header className="runner-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '13px', color: 'var(--student-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{test?.test_type?.toUpperCase()}</h2>
          <h1 style={{ margin: '4px 0 0', fontSize: '20px', color: 'var(--student-text)', fontWeight: 700, letterSpacing: '-0.5px' }}>{test?.title}</h1>
        </div>
        <div className="timer">
           {test?.duration_minutes}:00
        </div>
      </header>

      <main style={{ padding: '32px', flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {test?.test_type === 'quiz' && test?.questions?.length > 0 ? (
          test.questions.map((q: any) => (
            <div key={q.id} style={{ marginBottom: '24px', background: 'var(--student-card-bg)', border: '1px solid var(--student-border)', padding: '32px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ marginTop: 0, fontSize: '18px' }}>
                Question {q.question_number}: {q.question_text}
              </h3>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['a', 'b', 'c', 'd'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--student-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--student-border)' }}>
                    <input type="radio" name={`question-${q.id}`} value={opt} />
                    <span>{q[`option_${opt}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))
        ) : test?.test_type === 'code' && test?.problems?.length > 0 ? (
          test.problems.map((p: any) => (
            <div key={p.id} style={{ marginBottom: '24px', background: 'var(--student-card-bg)', border: '1px solid var(--student-border)', padding: '32px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ marginTop: 0, fontSize: '18px' }}>
                Problem {p.problem_number}: {p.title}
              </h3>
              <p style={{ color: 'var(--student-text-muted)', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.description}</p>
              
              {p.input_format && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Input Format</h4>
                  <p style={{ color: 'var(--student-text-muted)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{p.input_format}</p>
                </div>
              )}
              {p.output_format && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Output Format</h4>
                  <p style={{ color: 'var(--student-text-muted)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{p.output_format}</p>
                </div>
              )}
              
              <div style={{ marginTop: '24px' }}>
                <textarea 
                  placeholder="Write your code here..." 
                  style={{ width: '100%', minHeight: '200px', background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px', border: '1px solid #334155', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          ))
        ) : (
          <div style={{ marginTop: '24px', background: 'var(--student-card-bg)', border: '1px solid var(--student-border)', padding: '32px', borderRadius: '10px', textAlign: 'center' }}>
            <p style={{ color: 'var(--student-text-muted)', fontSize: '15px' }}>No questions available for this test.</p>
          </div>
        )}
      </main>

      <footer style={{ padding: '16px 32px', background: 'var(--student-card-bg)', borderTop: '1px solid var(--student-border)', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 0, boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
         <button className="btn-accent" style={{ width: 'auto', backgroundColor: '#0F172A' }} onClick={handleManualSubmit}>
            Submit Assessment
         </button>
      </footer>
    </div>
  );
};

export default TestRunner;
