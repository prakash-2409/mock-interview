import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './student.css';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

  // Theme management – persisted across sessions
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('student-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('student-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Hide navbar while taking a test (quiz or code arena)
  const isTestActive =
    location.pathname.includes('/take-quiz/') ||
    location.pathname.includes('/take-code/');

  if (isTestActive) {
    // Render a bare shell — no nav, no padding — so TestRunner can take full viewport
    return (
      <div style={{ minHeight: '100vh', background: 'var(--student-bg)' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="student-layout">
      <nav className="student-nav">
        {/* Brand */}
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="DevBeeZ Logo" className="brand-logo" />
          <span style={{ color: 'white' }}>Dev</span>
          <span style={{ color: '#FFC107' }}>BeeZ</span>
          <span style={{ fontSize: '0.85rem', color: '#64748B', marginLeft: 2 }}>StudentPortal</span>
        </Link>

        {/* Nav Links */}
        <div className="student-nav-links">
          <NavLink to="/student" end className={({ isActive }) => isActive ? 'student-nav-link active' : 'student-nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/student/quiz" className={({ isActive }) => isActive ? 'student-nav-link active' : 'student-nav-link'}>
            Quiz Arenas
          </NavLink>
          <NavLink to="/student/code" className={({ isActive }) => isActive ? 'student-nav-link active' : 'student-nav-link'}>
            Code Arenas
          </NavLink>
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* User Avatar */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.06)', padding: '5px 14px 5px 5px',
              borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFC107, #FF9800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0F172A', fontWeight: 800, fontSize: '0.9rem',
                boxShadow: '0 2px 6px rgba(255,193,7,0.3)'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>{user.name}</span>
                <span style={{ color: '#64748B', fontSize: '0.68rem', lineHeight: 1.2 }}>{user.rollNumber || 'Student'}</span>
              </div>
            </div>
          )}

          <button className="student-profile-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="student-page-content">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
