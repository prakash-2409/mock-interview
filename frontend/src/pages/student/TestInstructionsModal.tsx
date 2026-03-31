import React, { useState } from 'react';

interface Props {
  testType: 'Quiz' | 'Code';
  testTitle: string;
  onStart: () => void;
  onClose: () => void;
}

const TestInstructionsModal: React.FC<Props> = ({ testType, testTitle, onStart, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const isCode = testType === 'Code';
  const accentColor = isCode ? '#4F46E5' : '#10B981';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid var(--student-border)', marginBottom: '20px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
            background: isCode ? 'rgba(79,70,229,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${isCode ? 'rgba(79,70,229,0.25)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px'
          }}>
            {isCode ? '💻' : '📝'}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: accentColor, marginBottom: '4px' }}>
              {testType} Arena
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--student-text)', lineHeight: 1.2 }}>
              {testTitle}
            </h2>
          </div>
        </div>

        <p style={{ color: 'var(--student-text-muted)', fontSize: '14px', lineHeight: 1.65, marginBottom: '16px' }}>
          Please read the following rules carefully before starting. Any violation may result in immediate disqualification.
        </p>

        {/* Rules */}
        <ul className="instructions-list">
          <li>
            <strong>Full-screen mode is mandatory.</strong> You must remain in full-screen throughout. Exiting more than twice will trigger auto-submission.
          </li>
          <li>
            <strong>Tab switching is strictly monitored.</strong> A maximum of 2 tab switches are allowed. Exceeding this limit will terminate your test.
          </li>
          <li>
            <strong>Screenshots are blocked.</strong> Any screenshot attempt (PrintScreen, Snipping Tool, etc.) will be logged as a violation.
          </li>
          <li>
            <strong>Right-click and context menu are disabled</strong> during the test.
          </li>
          <li>
            <strong>Timer is fixed.</strong> The test will auto-submit when time expires, regardless of your progress.
          </li>
        </ul>

        {/* Checkbox */}
        <label className="checkbox-container" style={{ marginTop: '20px' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--student-text)' }}>
            I have read and agree to the test rules and regulations.
          </span>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', background: 'var(--student-bg)',
              color: 'var(--student-text-muted)', border: '1px solid var(--student-border)',
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
              fontFamily: "'Inter', sans-serif", transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            className="btn-accent btn-start"
            disabled={!agreed}
            onClick={onStart}
            style={{
              padding: '10px 28px',
              background: agreed ? '#EF4444' : 'var(--student-border)',
              color: agreed ? 'white' : 'var(--student-text-muted)'
            }}
          >
            Start Test →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestInstructionsModal;
