import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAntiCheat } from './useAntiCheat';
import './student.css';

// ────────────────────────────────────────────────────────────────────────────
// Timer hook — counts down from totalSeconds, calling onExpire when done
// ────────────────────────────────────────────────────────────────────────────
function useCountdown(totalSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpired = useRef(false);

  useEffect(() => {
    if (totalSeconds <= 0) return;
    setRemaining(totalSeconds);
    hasExpired.current = false;

    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!hasExpired.current) {
            hasExpired.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return { remaining, formatted, pct, stop };
}

// ────────────────────────────────────────────────────────────────────────────
// Warning Overlay component
// ────────────────────────────────────────────────────────────────────────────
interface WarningOverlayProps {
  message: string;
  onReturn?: () => void;
}
const WarningOverlay: React.FC<WarningOverlayProps> = ({ message, onReturn }) => (
  <div className="warning-overlay">
    <div className="warning-box">
      <div style={{ fontSize: '56px', marginBottom: '12px' }}>⚠️</div>
      <h2>VIOLATION DETECTED</h2>
      <p>{message}</p>
      {onReturn && (
        <button
          onClick={onReturn}
          style={{
            background: '#EF4444', color: 'white', border: 'none',
            padding: '12px 32px', borderRadius: '8px', fontSize: '15px',
            fontWeight: 700, cursor: 'pointer', width: '100%',
            transition: 'all 0.2s'
          }}
        >
          Return to Full Screen
        </button>
      )}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// Main TestRunner
// ────────────────────────────────────────────────────────────────────────────
const TestRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [code, setCode] = useState(`def solution():\n    # TODO: Implement your solution here\n    pass\n\nif __name__ == '__main__':\n    solution()`);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const submitCalled = useRef(false);

  // ── Anti-cheat setup ──────────────────────────────────────────────────
  const { enterFullscreen, deactivate } = useAntiCheat({
    maxTabSwitches: 2,
    maxFullscreenEscapes: 2,
    onWarning: (reason, warningsLeft) => {
      const isFS = reason.toLowerCase().includes('full-screen') || reason.toLowerCase().includes('full screen');
      setIsFullscreenWarning(isFS);
      setWarningMessage(reason);
      if (!isFS) setTimeout(() => setWarningMessage(''), 6000);
    },
    onTerminate: async (reason) => {
      setWarningMessage('');
      await forceSubmitRef.current(0, reason);
    }
  });

  // ── Fetch test ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTest();
    enterFullscreen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tests/${id}`).catch(() => null);
      if (response && response.ok) {
        const data = await response.json();
        setTest(data);
      } else {
        alert('Test not found');
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Score calculation (quiz) ──────────────────────────────────────────
  const calculateScore = () => {
    if (!test?.questions) return 0;
    let score = 0;
    test.questions.forEach((q: any) => {
      const key = String(q.id || q.question_number);
      if (answers[key] && answers[key] === q.correct_option) score++;
    });
    return score;
  };

  // ── Submit handler ────────────────────────────────────────────────────
  const forceSubmit = useCallback(async (score: number, reason?: string) => {
    if (submitCalled.current) return;
    submitCalled.current = true;
    setIsSubmitting(true);
    deactivate();

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user) { navigate('/student'); return; }

      const totalMarks = test?.questions?.length || test?.problems?.length || 10;
      const payload = {
        test_id: parseInt(id || '0'),
        student_id: user._id,
        score,
        total_marks: totalMarks,
        status: 'completed'
      };

      await fetch('http://localhost:5000/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

      if (reason) {
        navigate('/student');
        alert(`TEST TERMINATED: ${reason}`);
      } else {
        navigate('/student');
        alert(`✅ Test submitted successfully! Score: ${score}/${totalMarks}`);
      }
    } catch (err) {
      console.error('Submit error', err);
      navigate('/student');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, id, answers]);

  // Keep a stable ref so anti-cheat's onTerminate can call latest version
  const forceSubmitRef = useRef(forceSubmit);
  useEffect(() => { forceSubmitRef.current = forceSubmit; }, [forceSubmit]);

  const handleManualSubmit = () => {
    if (window.confirm('Are you sure you want to submit the test? This action cannot be undone.')) {
      const score = test?.test_type === 'quiz' ? calculateScore() : Math.floor(Math.random() * 10) + 1;
      forceSubmitRef.current(score);
    }
  };

  const handleTimerExpire = useCallback(() => {
    const score = test?.test_type === 'quiz' ? calculateScore() : 0;
    forceSubmitRef.current(score, undefined);
    // Small delay for UX
    setTimeout(() => {
      alert('⏰ Time is up! Your test has been auto-submitted.');
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test]);

  // ── Timer ─────────────────────────────────────────────────────────────
  const totalSeconds = (test?.duration_minutes || 0) * 60;
  const { formatted: timerDisplay, pct: timerPct, stop: stopTimer } = useCountdown(
    totalSeconds,
    handleTimerExpire
  );

  // Stop timer on submit
  useEffect(() => {
    if (isSubmitting) stopTimer();
  }, [isSubmitting, stopTimer]);

  const timerClass = timerPct <= 0.1 ? 'timer danger' : timerPct <= 0.25 ? 'timer warning' : 'timer';

  // ── Mock code runner ──────────────────────────────────────────────────
  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput('');
    setTimeout(() => {
      setConsoleOutput(
        `$ Running code...\n✓ Compilation successful\n\n[Test Case 1] Input: None → Output: Hello World!\n[Test Case 1] ✔ PASSED\n\nAll visible test cases passed!`
      );
      setIsRunning(false);
    }, 1200);
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading secure environment...
      </div>
    );
  }

  // ── Full-screen violation warning overlay ─────────────────────────────
  const warningUI = warningMessage && (
    <WarningOverlay
      message={warningMessage}
      onReturn={isFullscreenWarning ? () => { enterFullscreen(); setWarningMessage(''); } : undefined}
    />
  );

  // ══════════════════════════════════════════════════════════════════════
  // CODE ARENA LAYOUT
  // ══════════════════════════════════════════════════════════════════════
  if (test?.test_type === 'code') {
    const p = test.problems?.length > 0 ? test.problems[currentProblemIndex] : null;

    return (
      <div className="test-active-container" style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        background: '#0D1117', color: '#E6EDF3',
        fontFamily: "'Inter', sans-serif"
      }}>
        {warningUI}

        {/* Top Bar */}
        <div style={{
          height: '52px', background: '#161B22',
          borderBottom: '1px solid #30363D',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0
        }}>
          {/* Left: Logo + Test title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFC107, #FF9800)',
              borderRadius: '6px', padding: '4px 10px',
              fontSize: '12px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px'
            }}>
              DEVBEEZ
            </div>
            <span style={{ color: '#8B949E', fontSize: '13px' }}>|</span>
            <span style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 600 }}>{test.title}</span>
            <span style={{
              background: 'rgba(79,70,229,0.2)', color: '#818CF8',
              padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
              border: '1px solid rgba(79,70,229,0.3)'
            }}>
              CODE ARENA
            </span>
          </div>

          {/* Center: Problem navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {test.problems?.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentProblemIndex(idx)}
                style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: idx === currentProblemIndex ? '#4F46E5' : '#21262D',
                  color: idx === currentProblemIndex ? '#fff' : '#8B949E',
                  border: idx === currentProblemIndex ? '1px solid #4F46E5' : '1px solid #30363D',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  transition: 'all 0.15s'
                }}
              >{idx + 1}</button>
            ))}
          </div>

          {/* Right: Timer + Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={timerClass} style={{
              fontSize: '18px', padding: '6px 16px',
              background: '#21262D', border: '1px solid #30363D'
            }}>
              ⏱ {timerDisplay}
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              style={{
                padding: '8px 20px', background: '#EF4444', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Main body: split panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT — Problem description (40%) */}
          <div style={{
            width: '40%', minWidth: '320px',
            borderRight: '1px solid #30363D',
            display: 'flex', flexDirection: 'column',
            background: '#0D1117'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #21262D',
              overflowY: 'auto', flex: 1
            }}>
              {p ? (
                <>
                  {/* Problem header */}
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{
                      margin: '0 0 10px', fontSize: '20px', fontWeight: 700,
                      color: '#E6EDF3', lineHeight: 1.3
                    }}>
                      {currentProblemIndex + 1}. {p.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px', background: 'rgba(56,189,248,0.12)',
                        color: '#38BDF8', padding: '3px 10px', borderRadius: '20px',
                        fontWeight: 700, border: '1px solid rgba(56,189,248,0.2)'
                      }}>Coding</span>
                      <span style={{
                        fontSize: '11px', background: 'rgba(251,191,36,0.12)',
                        color: '#FBBF24', padding: '3px 10px', borderRadius: '20px',
                        fontWeight: 700, border: '1px solid rgba(251,191,36,0.2)'
                      }}>Marks: {p.marks}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    color: '#C9D1D9', lineHeight: 1.75, whiteSpace: 'pre-wrap',
                    fontSize: '14.5px', marginBottom: '24px'
                  }}>{p.description}</p>

                  {/* Input Format */}
                  {p.input_format && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#8B949E', margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Input Format</h4>
                      <div style={{
                        background: '#161B22', padding: '14px 16px', borderRadius: '8px',
                        color: '#C9D1D9', fontSize: '13.5px', lineHeight: 1.6,
                        border: '1px solid #21262D', whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', monospace"
                      }}>{p.input_format}</div>
                    </div>
                  )}

                  {/* Output Format */}
                  {p.output_format && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#8B949E', margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Output Format</h4>
                      <div style={{
                        background: '#161B22', padding: '14px 16px', borderRadius: '8px',
                        color: '#C9D1D9', fontSize: '13.5px', lineHeight: 1.6,
                        border: '1px solid #21262D', whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', monospace"
                      }}>{p.output_format}</div>
                    </div>
                  )}

                  {/* Sample Input */}
                  {p.sample_input && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#8B949E', margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Sample Input</h4>
                      <pre style={{
                        background: '#161B22', padding: '14px 16px', borderRadius: '8px',
                        margin: 0, border: '1px solid #21262D'
                      }}>
                        <code style={{ color: '#79C0FF', fontSize: '13px', fontFamily: "'Fira Code', monospace" }}>{p.sample_input}</code>
                      </pre>
                    </div>
                  )}

                  {/* Sample Output */}
                  {p.sample_output && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ color: '#8B949E', margin: '0 0 8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Sample Output</h4>
                      <pre style={{
                        background: '#161B22', padding: '14px 16px', borderRadius: '8px',
                        margin: 0, border: '1px solid #21262D'
                      }}>
                        <code style={{ color: '#7EE787', fontSize: '13px', fontFamily: "'Fira Code', monospace" }}>{p.sample_output}</code>
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#8B949E' }}>No active problem found.</p>
              )}
            </div>

            {/* Bottom nav */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #21262D',
              background: '#161B22', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={currentProblemIndex === 0}
                  onClick={() => setCurrentProblemIndex(i => i - 1)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px',
                    background: currentProblemIndex === 0 ? '#0D1117' : '#21262D',
                    color: currentProblemIndex === 0 ? '#484F58' : '#C9D1D9',
                    border: '1px solid #30363D', cursor: currentProblemIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 600
                  }}
                >← Previous</button>
                <button
                  disabled={currentProblemIndex === (test.problems?.length - 1)}
                  onClick={() => setCurrentProblemIndex(i => i + 1)}
                  style={{
                    padding: '7px 16px', borderRadius: '6px',
                    background: currentProblemIndex === (test.problems?.length - 1) ? '#0D1117' : '#21262D',
                    color: currentProblemIndex === (test.problems?.length - 1) ? '#484F58' : '#C9D1D9',
                    border: '1px solid #30363D',
                    cursor: currentProblemIndex === (test.problems?.length - 1) ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 600
                  }}
                >Next →</button>
              </div>
              <span style={{ fontSize: '12px', color: '#484F58', fontWeight: 600 }}>
                {currentProblemIndex + 1} / {test.problems?.length || 0}
              </span>
            </div>
          </div>

          {/* RIGHT — Editor + Console (60%) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Editor toolbar */}
            <div style={{
              padding: '10px 16px', background: '#161B22',
              borderBottom: '1px solid #21262D',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  color: '#79C0FF', fontSize: '12px', fontFamily: "'Fira Code', monospace",
                  fontWeight: 600, background: '#0D1117', padding: '5px 10px',
                  borderRadius: '4px', border: '1px solid #30363D'
                }}>main.py</span>
                <select style={{
                  background: '#21262D', color: '#C9D1D9',
                  border: '1px solid #30363D', borderRadius: '6px',
                  padding: '5px 10px', fontSize: '12px', outline: 'none', cursor: 'pointer'
                }}>
                  <option>Python 3</option>
                  <option>Java</option>
                  <option>C++</option>
                  <option>JavaScript</option>
                </select>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                style={{
                  padding: '7px 18px',
                  background: isRunning ? '#21262D' : 'rgba(52, 211, 153, 0.12)',
                  color: '#34D399', border: '1px solid rgba(52,211,153,0.35)',
                  borderRadius: '6px', cursor: isRunning ? 'wait' : 'pointer',
                  fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {isRunning ? (
                  <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #34D399', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Running…</>
                ) : '▶  Run Code'}
              </button>
            </div>

            {/* Code textarea */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{
                flex: 1, padding: '20px 24px',
                background: '#0D1117', color: '#E6EDF3',
                border: 'none', outline: 'none',
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontSize: '14px', resize: 'none', lineHeight: '1.65',
                caretColor: '#58A6FF'
              }}
              spellCheck={false}
            />

            {/* Console panel */}
            <div style={{
              height: '220px', display: 'flex', flexDirection: 'column',
              borderTop: '1px solid #21262D', background: '#161B22', flexShrink: 0
            }}>
              <div style={{
                padding: '10px 16px', borderBottom: '1px solid #21262D',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#0D1117', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#E6EDF3', fontSize: '13px', fontWeight: 700 }}>Test Case Output</span>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: isRunning ? '#FBBF24' : consoleOutput ? '#34D399' : '#484F58'
                  }} />
                </div>
                <button
                  onClick={handleManualSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '7px 20px', background: '#EF4444', color: 'white',
                    border: 'none', borderRadius: '7px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700,
                    boxShadow: '0 0 12px rgba(239,68,68,0.25)',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Assessment'}
                </button>
              </div>
              <div style={{
                padding: '14px 18px', overflowY: 'auto', flex: 1,
                fontFamily: "'Fira Code', Consolas, monospace", fontSize: '13px'
              }}>
                {consoleOutput ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#C9D1D9' }}>{consoleOutput}</pre>
                ) : (
                  <>
                    <div style={{ color: '#484F58', marginBottom: '8px' }}>$ environment connected. awaiting execution...</div>
                    <div style={{ color: '#C9D1D9' }}>
                      <span style={{ color: '#79C0FF' }}>Info:</span> You must run the code to see test case results.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // QUIZ ARENA LAYOUT
  // ══════════════════════════════════════════════════════════════════════
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length || 0;

  return (
    <div className="test-active-container" style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      background: 'var(--student-bg)', color: 'var(--student-text)'
    }}>
      {warningUI}

      {/* ── Quiz Top Bar ───────────────────────────────────────────── */}
      <header style={{
        background: 'var(--student-card-bg)',
        borderBottom: '1px solid var(--student-border)',
        padding: '0 28px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left: Logo + Test info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FFC107, #FF9800)',
            borderRadius: '6px', padding: '4px 10px',
            fontSize: '12px', fontWeight: 800, color: '#0F172A'
          }}>
            DEVBEEZ
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--student-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {test?.test_type?.toUpperCase() || 'QUIZ'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--student-text)', letterSpacing: '-0.3px' }}>
              {test?.title}
            </div>
          </div>
        </div>

        {/* Center: Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--student-text-muted)' }}>
              {answeredCount} / {totalQuestions} answered
            </span>
          </div>
          <div style={{
            width: '200px', height: '6px', background: 'var(--student-border)',
            borderRadius: '3px', overflow: 'hidden'
          }}>
            <div style={{
              width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10B981, #34D399)',
              borderRadius: '3px', transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Right: Timer + Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={timerClass}>{timerDisplay}</div>
          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              background: 'var(--student-danger)', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* ── Quiz Body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Question Sidebar */}
        <div style={{
          width: '200px', background: 'var(--student-card-bg)',
          borderRight: '1px solid var(--student-border)',
          overflowY: 'auto', padding: '16px', flexShrink: 0
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--student-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px'
          }}>Questions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {test?.questions?.map((q: any, idx: number) => {
              const key = String(q.id || q.question_number);
              const isAnswered = !!answers[key];
              return (
                <button
                  key={key}
                  onClick={() => {
                    const el = document.getElementById(`q-${key}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: '6px',
                    background: isAnswered ? 'rgba(16,185,129,0.15)' : 'var(--student-bg)',
                    color: isAnswered ? '#10B981' : 'var(--student-text-muted)',
                    border: `2px solid ${isAnswered ? '#10B981' : 'var(--student-border)'}`,
                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    transition: 'all 0.15s'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--student-text-muted)' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981' }} />
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--student-text-muted)' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'var(--student-bg)', border: '2px solid var(--student-border)' }} />
              Unanswered
            </div>
          </div>
        </div>

        {/* Questions main scroll area */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          {test?.questions?.length > 0 ? (
            test.questions.map((q: any, idx: number) => {
              const key = String(q.id || q.question_number);
              return (
                <div id={`q-${key}`} key={key} className="question-card">
                  {/* Question header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                      flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                      background: answers[key] ? 'rgba(16,185,129,0.15)' : 'var(--student-bg)',
                      border: `2px solid ${answers[key] ? '#10B981' : 'var(--student-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 800,
                      color: answers[key] ? '#10B981' : 'var(--student-text-muted)'
                    }}>
                      {idx + 1}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--student-text)', lineHeight: 1.55 }}>
                      {q.question_text}
                    </h3>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '46px' }}>
                    {(['a', 'b', 'c', 'd'] as const).map(opt => {
                      const isSelected = answers[key] === opt;
                      return (
                        <label
                          key={opt}
                          className={`option-label${isSelected ? ' selected' : ''}`}
                          onClick={() => setAnswers(prev => ({ ...prev, [key]: opt }))}
                        >
                          <input
                            type="radio"
                            name={`q-${key}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => setAnswers(prev => ({ ...prev, [key]: opt }))}
                          />
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                            background: isSelected ? 'rgba(16,185,129,0.15)' : 'var(--student-card-bg)',
                            border: `1px solid ${isSelected ? '#10B981' : 'var(--student-border)'}`,
                            fontSize: '12px', fontWeight: 800, color: isSelected ? '#10B981' : 'var(--student-text-muted)'
                          }}>
                            {opt.toUpperCase()}
                          </span>
                          <span style={{ color: 'var(--student-text)', fontSize: '15px' }}>
                            {q[`option_${opt}`]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="question-card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--student-text-muted)' }}>No questions available for this test.</p>
            </div>
          )}

          {/* Bottom submit */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            padding: '8px 0 32px'
          }}>
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              style={{
                padding: '14px 40px',
                background: 'var(--student-danger)', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontSize: '16px', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                transition: 'all 0.2s',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Submitting…' : '🚀 Submit Assessment'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestRunner;
