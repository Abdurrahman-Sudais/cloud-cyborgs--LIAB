// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing fade-in">
      {/* Navbar */}
      <header className="landing-nav">
        <div className="landing-logo">
          <div className="sidebar-logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span className="landing-logo-name">LIAB</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <button className="btn btn-cyan btn-sm" onClick={() => navigate('/dashboard')}>
              Open Workspace →
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth')}>Sign In</button>
              <button className="btn btn-cyan btn-sm" onClick={() => navigate('/auth')}>Get Started →</button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div style={{ marginBottom: 20 }}>
          <span className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
            POWERED BY GEMMA 4 NEURAL MEMORY
          </span>
        </div>

        <h1 className="hero-title">
          The AI Operating System for Student Success.
        </h1>

        <p className="hero-sub">
          LIAB connects your notes, coding tasks, study schedule, and wellness into a single, context-aware student workspace.
        </p>

        <div className="hero-ctas">
          <button className="btn btn-cyan btn-lg" onClick={() => navigate('/auth')}>
            Launch OS Workspace →
          </button>
          <a href="#features" className="btn btn-secondary btn-lg">
            Explore Features
          </a>
        </div>

        {/* Floating OS Workspace Mockup */}
        <div className="hero-preview-card">
          <div className="hero-preview-header">
            <div className="preview-title">LIAB CORE MEMORY • LIVE CONTEXT</div>
          </div>
          <div className="hero-preview-body">
            <div className="memory-bubble">
              <div className="memory-tag">AI Context Integration</div>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                "Welcome back, Alex. You studied <strong>Computer Science Lecture 1</strong> yesterday. Your <strong>7-Day Study Plan</strong> is active, and your focus score is optimal. Ready for today's review?"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section id="features" style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: 8, color: '#FFF' }}>Four Core Pillars. One Shared Memory.</h2>
          <p style={{ maxWidth: 560, margin: '0 auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Every feature feeds into a unified context layer so you never have to repeat yourself.
          </p>
        </div>

        <div className="grid-4">
          {[
            { tag: 'LEARN', title: 'Study & Notes', desc: 'Summarise lecture PDFs, test yourself with quizzes & flashcards.' },
            { tag: 'BUILD', title: 'Coding Coach', desc: 'Instant code debugging, concept explanations & practice problem generation.' },
            { tag: 'BALANCE', title: 'Wellness & Timer', desc: 'Pomodoro focus timer with mood check-ins to prevent academic burnout.' },
            { tag: 'CAMPUS', title: 'Campus Guide', desc: 'Real-time library occupancy, student support links & FAQs.' },
          ].map(f => (
            <div key={f.title} className="card">
              <div className="badge badge-muted" style={{ marginBottom: 12 }}>{f.tag}</div>
              <h3 style={{ marginBottom: 6, fontSize: '1rem', color: '#FFF' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border-default)', margin: '80px 0 0', padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Built for Google Gemma 4 Hackathon by Abdurrahman Sudais & Awwal Adepoju
      </footer>

      <style>{`
        .landing { min-height: 100vh; background: var(--bg-app); }
        .landing-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 48px; max-width: 1240px; margin: 0 auto;
        }
        .landing-logo { display: flex; align-items: center; gap: 10px; }
        .landing-logo-name { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.02em; color: #FFF; }
        
        .hero {
          max-width: 860px; margin: 40px auto 0; text-align: center; padding: 0 24px;
        }
        .hero-title { margin-bottom: 16px; font-size: 2.75rem; color: #FFF; font-weight: 800; letter-spacing: -0.03em; }
        .hero-sub { font-size: 1.05rem; color: var(--text-secondary); max-width: 640px; margin: 0 auto 32px; }
        .hero-ctas { display: flex; gap: 14px; justify-content: center; margin-bottom: 48px; }

        .hero-preview-card {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--radius-lg); overflow: hidden;
          box-shadow: var(--shadow-card); text-align: left;
        }
        .hero-preview-header {
          padding: 12px 18px;
          background: var(--bg-surface); border-bottom: 1px solid var(--border-subtle);
        }
        .preview-title { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.08em; fontFamily: var(--font-mono); }

        .hero-preview-body { padding: 20px; background: var(--bg-app); }
        .memory-bubble {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: var(--radius-md); padding: 16px 18px;
        }
        .memory-tag { font-size: 0.75rem; font-weight: 700; color: var(--cyan-text); margin-bottom: 6px; fontFamily: var(--font-mono); }
      `}</style>
    </div>
  );
}
