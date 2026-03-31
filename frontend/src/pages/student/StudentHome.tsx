import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentHome: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchResults(parsedUser._id);
      } catch (e) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchResults = async (studentId: string) => {
      try {
          const res = await fetch(`http://localhost:5000/api/results?student_id=${studentId}`);
          if (res.ok) {
              const data = await res.json();
              setResults(data);
          }
      } catch (e) {
          console.error(e);
      }
  };

  if (!user) return <div style={{padding: '32px'}}>Loading profile...</div>;

  const testsAttended = results.length;
  
  const quizResults = results.filter(r => r.test_type === 'quiz');
  const codingResults = results.filter(r => r.test_type === 'code');
  
  const quizAverage = quizResults.length > 0 
      ? quizResults.reduce((acc, curr) => acc + (curr.score / curr.total_marks), 0) / quizResults.length 
      : 0;
      
  const codeAverage = codingResults.length > 0 
      ? codingResults.reduce((acc, curr) => acc + (curr.score / curr.total_marks), 0) / codingResults.length 
      : 0;

  const overallProgress = testsAttended > 0 
      ? Math.round(((quizAverage * quizResults.length) + (codeAverage * codingResults.length)) / testsAttended * 100) 
      : 0;

  return (
    <div style={{ animation: "fadeIn 0.6s ease-out", maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1 style={{fontSize: '36px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-1px'}}>Dashboard</h1>
          <div style={{ height: '4px', width: '60%', background: 'linear-gradient(90deg, #FFC107 0%, rgba(255, 193, 7, 0) 100%)', borderRadius: '4px' }}></div>
        </div>
      </div>

      {/* Modern Profile Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '16px', padding: '32px 40px', display: 'flex', gap: '32px', alignItems: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '-80px', right: '150px', width: '300px', height: '300px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '50%' }}></div>
          
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '3rem', boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.1), 0 10px 15px rgba(0,0,0,0.3)', flexShrink: 0, zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div style={{ zIndex: 1, flex: 1 }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Welcome back, {user.name}! 👋</h2>
              <p style={{ color: '#94A3B8', margin: '0 0 20px 0', fontSize: '15px' }}>Ready to conquer your next coding challenge?</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>Roll Number</div>
                      <div style={{ fontSize: '15px', color: '#F1F5F9', fontWeight: 600 }}>{user.rollNumber || 'None'}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>Department</div>
                      <div style={{ fontSize: '15px', color: '#F1F5F9', fontWeight: 600 }}>{user.department || 'None'}</div>
                  </div>
                  {user.registrationNumber && (
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>Reg. Number</div>
                        <div style={{ fontSize: '15px', color: '#F1F5F9', fontWeight: 600 }}>{user.registrationNumber}</div>
                    </div>
                  )}
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>Email</div>
                      <div style={{ fontSize: '15px', color: '#F1F5F9', fontWeight: 600 }}>{user.emailId || user.email || 'None'}</div>
                  </div>
              </div>
          </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>Performance Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #3B82F6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '100px', opacity: 0.03, color: '#3B82F6', fontWeight: 900 }}>1</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>📊</div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tests Attended</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>{testsAttended}</div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #10B981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '100px', opacity: 0.03, color: '#10B981', fontWeight: 900 }}>Q</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>📝</div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg. Quiz Score</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>{Math.round(quizAverage * 100)}<span style={{fontSize: '20px', color: '#94A3B8'}}>%</span></div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #8B5CF6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '100px', opacity: 0.03, color: '#8B5CF6', fontWeight: 900 }}>C</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>💻</div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg. Coding Score</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>{Math.round(codeAverage * 100)}<span style={{fontSize: '20px', color: '#94A3B8'}}>%</span></div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '4px solid #F59E0B', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-15px', top: '-15px', fontSize: '100px', opacity: 0.03, color: '#F59E0B', fontWeight: 900 }}>%</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px' }}>🚀</div>
                <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', marginTop: '8px' }}>{overallProgress}<span style={{fontSize: '20px', color: '#94A3B8'}}>%</span></div>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Recent Assessments</h2>
            <div style={{ fontSize: '14px', color: '#3B82F6', fontWeight: 600, cursor: 'pointer' }}>View All →</div>
        </div>
        
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                     <th style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Test Name</th>
                     <th style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Type</th>
                     <th style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Score</th>
                     <th style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Date Taken</th>
                  </tr>
               </thead>
               <tbody>
                  {results.length === 0 ? (
                      <tr>
                         <td style={{ padding: '48px 24px', fontSize: '15px', color: '#64748B' }} colSpan={4} align="center">
                            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                            <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>No assessments taken yet</div>
                            <div>Start taking quizzes and code tests to track your progress here.</div>
                         </td>
                      </tr>
                  ) : (
                      results.map(r => (
                          <tr key={r.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                             <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0F172A', borderBottom: '1px solid #F1F5F9', fontWeight: 600 }}>{r.test_title}</td>
                             <td style={{ padding: '20px 24px', fontSize: '15px', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                                 <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', background: r.test_type === 'code' ? '#EEF2FF' : '#FEF3C7', color: r.test_type === 'code' ? '#4F46E5' : '#D97706', border: `1px solid ${r.test_type === 'code' ? '#C7D2FE' : '#FDE68A'}` }}>
                                     {r.test_type.toUpperCase()}
                                 </span>
                             </td>
                             <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>
                                 <span style={{ fontWeight: 700 }}>{r.score}</span> <span style={{ color: '#94A3B8' }}>/ {r.total_marks}</span>
                                 <span style={{ marginLeft: '12px', background: (r.score/r.total_marks) > 0.7 ? '#ECFDF5' : ((r.score/r.total_marks) > 0.4 ? '#FEF3C7' : '#FEF2F2'), color: (r.score/r.total_marks) > 0.7 ? '#10B981' : ((r.score/r.total_marks) > 0.4 ? '#D97706' : '#EF4444'), padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                                    {Math.round((r.score/r.total_marks) * 100)}%
                                 </span>
                             </td>
                             <td style={{ padding: '20px 24px', fontSize: '14px', color: '#64748B', borderBottom: '1px solid #F1F5F9', fontWeight: 500 }}>{new Date(r.submitted_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                          </tr>
                      ))
                  )}
               </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

export default StudentHome;
