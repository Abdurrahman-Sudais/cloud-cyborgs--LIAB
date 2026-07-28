// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMemory } from '../hooks/useMemory';
import { useAI } from '../hooks/useAI';
import { useNavigate } from 'react-router-dom';
import { getNotes, getQuizzes, getCodeSessions, updateStreak } from '../firebase/firestore';

const SYSTEM_PROMPT = (profile, memory) => `
You are LIAB, a helpful AI study companion for students.
Student: ${profile?.name || 'Alex'} (${profile?.course || 'Student'}).
Context:
- Study streak: ${memory?.studyStreak || 0} days
- Recent topics: ${memory?.currentTopics?.join(', ') || 'None yet'}

Give a warm 2-sentence greeting.
Sentence 1: Welcome them back and mention what they worked on recently or their streak.
Sentence 2: Suggest a simple next step for today (e.g. review notes, try a quick quiz, or build something).
Keep it clean, clear, and friendly. No complex technical jargon or buzzwords.
`.trim();

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { memory, loading: memLoading } = useMemory();
  const { generate, loading: aiLoading } = useAI();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({ notes: 0, quizzes: 0, codeSessions: 0 });

  useEffect(() => {
    if (!user || memLoading) return;
    Promise.all([
      getNotes(user.uid),
      getQuizzes(user.uid),
      getCodeSessions(user.uid),
      updateStreak(user.uid),
    ]).then(([notes, quizzes, cs]) => {
      setStats({ notes: notes.length, quizzes: quizzes.length, codeSessions: cs.length });
    });
  }, [user, memLoading]);

  useEffect(() => {
    if (!profile || memLoading) return;
    generate(SYSTEM_PROMPT(profile, memory), 'Generate dashboard greeting now.')
      .then(res => setGreeting(res || 'Welcome back! Choose a feature below to continue studying.'));
  }, [profile, memLoading]);

  const SIMPLE_MODULES = [
    { id: 'learn', label: 'Study & Notes', tag: 'LEARN', desc: 'Summarise lecture PDFs, test yourself with quizzes & flashcards', to: '/learn', count: `${stats.notes} Saved Notes` },
    { id: 'build', label: 'Coding Coach', tag: 'BUILD', desc: 'Debug code errors, learn programming concepts & solve practice problems', to: '/build', count: `${stats.codeSessions} Code Runs` },
    { id: 'plan',  label: 'Study Planner', tag: 'PLAN', desc: 'Get an AI-generated 7-day schedule tailored to your goals', to: '/plan', count: 'Weekly Plan' },
    { id: 'balance', label: 'Wellness & Timer', tag: 'BALANCE', desc: 'Pomodoro focus timer with mood check-ins to prevent study fatigue', to: '/balance', count: 'Focus Mode' },
  ];

  return (
    <div className="page fade-in">
      {/* Dashboard Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, {profile?.name || 'Student'}</p>
          </div>
          <div className="badge badge-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
            STREAK: {memory?.studyStreak || 1} DAYS
          </div>
        </div>
      </div>

      {/* AI Greeting Card */}
      <div className="card" style={{ marginBottom: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan-primary)', boxShadow: '0 0 8px var(--cyan-primary)' }} />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-text)', fontWeight: 600 }}>
            AI STUDY ASSISTANT
          </span>
        </div>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
          {aiLoading ? 'Checking your study progress...' : greeting}
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12 }}>
          FEATURES
        </div>
        <div className="grid-2">
          {SIMPLE_MODULES.map(m => (
            <div
              key={m.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 135 }}
              onClick={() => navigate(m.to)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="badge badge-muted">{m.tag}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.count}</span>
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{m.label}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--cyan-text)', marginTop: 14, fontWeight: 600 }}>
                Open Feature →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Subject Bar */}
      <div className="card card-sm" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-app)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recent Subject:</span>
          <span className="badge badge-cyan">
            {memory?.currentTopics?.[0] || 'General Studies'}
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campus')}>
          Campus Assistant →
        </button>
      </div>
    </div>
  );
}
