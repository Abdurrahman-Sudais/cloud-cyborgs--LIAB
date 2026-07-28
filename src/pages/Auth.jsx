// src/pages/Auth.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../firebase/auth';
import toast from 'react-hot-toast';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '', university: '', course: '', year: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await signUpWithEmail(form.email, form.password, {
          name: form.name, university: form.university,
          course: form.course, year: form.year,
        });
        toast.success('Account created! Welcome to LIAB 🎉');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message.replace('Firebase: ', '').replace(/ \(.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card card-glass fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🧠</div>
          <div className="auth-logo-text">
            <div className="auth-logo-name">LIAB</div>
            <div className="auth-logo-sub">AI Operating System for Student Success</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >Sign In</button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >Create Account</button>
        </div>

        <form onSubmit={handleEmail} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" placeholder="e.g. Abdurrahman Sudais" value={form.name} onChange={set('name')} required />
              </div>
              <div className="input-group">
                <label>University</label>
                <input className="input" placeholder="e.g. University of Lagos" value={form.university} onChange={set('university')} required />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="input-group">
                  <label>Course / Major</label>
                  <input className="input" placeholder="e.g. Industrial Chemistry" value={form.course} onChange={set('course')} required />
                </div>
                <div className="input-group">
                  <label>Year</label>
                  <select className="input" value={form.year} onChange={set('year')} required>
                    <option value="">Select year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input className="input" type="email" placeholder="you@university.edu" value={form.email} onChange={set('email')} required />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Working...</> : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button className="btn btn-secondary btn-full" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-footer">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-base);
          padding: 32px 16px;
          position: relative;
          overflow: hidden;
        }

        .auth-bg { position: absolute; inset: 0; pointer-events: none; }
        .auth-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.3;
        }
        .auth-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, var(--accent), transparent);
          top: -150px; left: -150px;
        }
        .auth-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, var(--purple), transparent);
          bottom: -100px; right: -100px;
        }

        .auth-card {
          width: 100%; max-width: 480px;
          background: rgba(13,17,23,0.85);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-xl);
          padding: 40px;
          position: relative; z-index: 1;
          box-shadow: var(--shadow-lg), 0 0 60px var(--accent-glow);
        }

        .auth-logo {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 32px;
        }
        .auth-logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, var(--accent), var(--purple));
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          box-shadow: 0 0 24px var(--accent-glow);
          flex-shrink: 0;
        }
        .auth-logo-name {
          font-size: 1.4rem; font-weight: 900;
          letter-spacing: 0.05em;
        }
        .auth-logo-sub {
          font-size: 0.7rem; color: var(--text-muted);
          line-height: 1.3;
          max-width: 200px;
        }

        .auth-tabs {
          display: flex;
          background: var(--bg-elevated);
          border-radius: var(--radius);
          padding: 4px;
          margin-bottom: 28px;
          border: 1px solid var(--border);
        }
        .auth-tab {
          flex: 1; padding: 8px;
          background: none; border: none;
          font-family: var(--font); font-size: 0.875rem; font-weight: 600;
          color: var(--text-muted);
          border-radius: calc(var(--radius) - 2px);
          cursor: pointer; transition: var(--trans);
        }
        .auth-tab.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 0 16px var(--accent-glow);
        }

        .auth-form { margin-bottom: 20px; }

        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }
        .auth-divider span { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }

        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 0.85rem;
          color: var(--text-muted) !important;
        }
        .auth-switch {
          background: none; border: none;
          color: var(--text-accent); font-weight: 600;
          cursor: pointer; font-size: 0.85rem;
          font-family: var(--font);
          transition: var(--trans);
        }
        .auth-switch:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}
