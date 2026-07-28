// src/pages/Balance.jsx — Minimalist Academic Wellness & Timer
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAI } from '../hooks/useAI';
import { useMemory } from '../hooks/useMemory';
import { logStudySession } from '../firebase/firestore';
import toast from 'react-hot-toast';

const WELLNESS_SYSTEM = (profile, sessionMins, mood, streak) => `
You are LIAB's Wellness Assistant for ${profile?.name || 'a student'}.
Context:
- Course: ${profile?.course || 'General Studies'}
- Study streak: ${streak || 0} days
- Studied today: ${sessionMins} mins
- Current status: ${mood}

Provide a concise, 2-3 sentence personalized wellness tip.
Give 1 practical, actionable suggestion for focus or rest.
Keep tone warm, realistic, and encouraging. No emojis or fluff.
`.trim();

const MOOD_OPTIONS = [
  { label: 'Focused', value: 'focused' },
  { label: 'Normal', value: 'normal' },
  { label: 'Stressed', value: 'stressed' },
  { label: 'Fatigued', value: 'fatigued' },
  { label: 'High Energy', value: 'high_energy' },
];

const RECOMMENDED_BREAKS = [
  { title: 'Screen Reset', desc: 'Look at an object 20 feet away for 20 seconds.', duration: '1 min' },
  { title: 'Controlled Breathing', desc: 'Inhale 4s, hold 4s, exhale 4s to calm nervous system.', duration: '3 mins' },
  { title: 'Hydration Break', desc: 'Drink a glass of water away from your desk.', duration: '2 mins' },
  { title: 'Light Stretch', desc: 'Stand up and stretch neck, shoulders, and wrist joints.', duration: '5 mins' },
];

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;

export default function Balance() {
  const { user, profile } = useAuth();
  const { generate, loading: aiLoading } = useAI();
  const { memory, update: updateMemory } = useMemory();

  const [mood, setMood] = useState(null);
  const [wellnessMsg, setWellnessMsg] = useState('');
  const [tab, setTab] = useState('timer'); // timer | wellness | techniques

  // Timer state
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro | break
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleSessionEnd();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleSessionEnd = () => {
    const mins = timerMode === 'pomodoro' ? 25 : 5;
    setSessionCount(s => s + 1);
    toast.success(timerMode === 'break' ? 'Break finished! Ready to focus.' : 'Focus session completed!');
    if (timerMode !== 'break' && user?.uid) {
      logStudySession(user.uid, { module: 'balance', duration: mins, type: 'pomodoro' }).catch(() => {});
      updateMemory({ totalStudyMinutes: (memory?.totalStudyMinutes || 0) + mins }).catch(() => {});
    }
  };

  const resetTimer = (mode) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimerMode(mode);
    setTimeLeft(mode === 'pomodoro' ? POMODORO : SHORT_BREAK);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalSecs = timerMode === 'pomodoro' ? POMODORO : SHORT_BREAK;
  const pct = ((totalSecs - timeLeft) / totalSecs) * 100;

  const getWellnessAdvice = async (selectedMood) => {
    const mins = memory?.totalStudyMinutes || 0;
    const msg = await generate(WELLNESS_SYSTEM(profile, mins, selectedMood, memory?.studyStreak), 'Provide wellness check.');
    setWellnessMsg(msg);
    setTab('wellness');
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h2>Focus & Recovery</h2>
        <p>Timer, mood tracking, and evidence-based study techniques</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'timer' ? 'active' : ''}`} onClick={() => setTab('timer')}>
          Focus Timer
        </button>
        <button className={`tab-btn ${tab === 'wellness' ? 'active' : ''}`} onClick={() => setTab('wellness')}>
          Wellness Advisor
        </button>
        <button className={`tab-btn ${tab === 'techniques' ? 'active' : ''}`} onClick={() => setTab('techniques')}>
          Study Methods
        </button>
      </div>

      {/* ── Tab: Timer ── */}
      {tab === 'timer' && (
        <div className="grid-2">
          {/* Main Timer Display */}
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
              <button
                className={`btn btn-sm ${timerMode === 'pomodoro' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => resetTimer('pomodoro')}
              >
                Focus (25m)
              </button>
              <button
                className={`btn btn-sm ${timerMode === 'break' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => resetTimer('break')}
              >
                Short Break (5m)
              </button>
            </div>

            {/* Clean Monochromatic Circular Timer */}
            <div className="timer-ring-container">
              <svg className="timer-svg" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r="95" fill="none" stroke="var(--bg-surface)" strokeWidth="6" />
                <circle
                  cx="110" cy="110" r="95" fill="none"
                  stroke="var(--cyan-primary)" strokeWidth="6"
                  strokeDasharray="597"
                  strokeDashoffset={597 - (597 * pct) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="timer-center-content">
                <div className="timer-clock">{fmt(timeLeft)}</div>
                <div className="timer-status">{running ? 'IN PROGRESS' : 'PAUSED'}</div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button className="btn btn-secondary" onClick={() => resetTimer(timerMode)}>
                Reset
              </button>
              <button
                className={`btn ${running ? 'btn-secondary' : 'btn-cyan'}`}
                style={{ minWidth: 110 }}
                onClick={() => setRunning(r => !r)}
              >
                {running ? 'Pause' : 'Start Focus'}
              </button>
            </div>

            {sessionCount > 0 && (
              <div style={{ marginTop: 20, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                COMPLETED TODAY: {sessionCount} SESSIONS
              </div>
            )}
          </div>

          {/* Mood Check & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>How are you feeling right now?</h3>
              <p style={{ fontSize: '0.825rem', marginBottom: 16 }}>Select your state for tailored wellness advice.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`mood-tile ${mood === m.value ? 'selected' : ''}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary btn-full"
                disabled={!mood || aiLoading}
                onClick={() => getWellnessAdvice(mood)}
              >
                {aiLoading ? 'Generating Advice...' : 'Get Wellness Tip →'}
              </button>
            </div>

            {/* Stats Overview */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-text)', fontFamily: 'var(--font-mono)' }}>
                  {memory?.totalStudyMinutes || 0}m
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Studied Today</div>
              </div>
              <div style={{ width: 1, background: 'var(--border-default)' }} />
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {memory?.studyStreak || 1}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Wellness Advisor ── */}
      {tab === 'wellness' && (
        <div className="fade-in">
          {wellnessMsg ? (
            <div className="card" style={{ marginBottom: 24, border: '1px solid var(--border-strong)' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-text)', marginBottom: 8, fontWeight: 600 }}>
                WELLNESS ADVISORY
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {wellnessMsg}
              </p>
              <div className="divider" />
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('timer')}>
                ← Back to Timer
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
              <h3 style={{ marginBottom: 6 }}>No active wellness check</h3>
              <p style={{ marginBottom: 16 }}>Select your current status on the Focus Timer tab to get personalized guidance.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('timer')}>
                Go to Timer →
              </button>
            </div>
          )}

          {/* Recommended Recovery Breaks */}
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12 }}>
              RECOMMENDED RECOVERY BREAKS
            </div>
            <div className="grid-2">
              {RECOMMENDED_BREAKS.map(b => (
                <div key={b.title} className="card card-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>{b.title}</div>
                    <span className="badge badge-muted">{b.duration}</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Study Methods ── */}
      {tab === 'techniques' && (
        <div className="fade-in">
          <div className="grid-2">
            {[
              { title: 'Pomodoro Technique', desc: 'Work for 25 minutes uninterrupted, then take a 5-minute break. Prevents mental fatigue during long study blocks.' },
              { title: 'Spaced Repetition', desc: 'Review material at increasing intervals (1 day, 3 days, 1 week) to maximize long-term memory retention.' },
              { title: 'Active Recall', desc: 'Test yourself without looking at notes. Forcing your brain to retrieve information builds stronger neural connections.' },
              { title: 'Feynman Technique', desc: 'Explain a complex concept in simple plain language as if teaching a beginner to highlight understanding gaps.' },
            ].map(t => (
              <div key={t.title} className="card">
                <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#FFF' }}>{t.title}</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .timer-ring-container {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 0 auto;
        }

        .timer-svg {
          width: 100%;
          height: 100%;
        }

        .timer-center-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .timer-clock {
          font-size: 2.75rem;
          font-weight: 800;
          font-family: var(--font-mono);
          letter-spacing: -0.03em;
          color: var(--text-primary);
          line-height: 1;
        }

        .timer-status {
          font-size: 0.65rem;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-top: 8px;
        }

        .mood-tile {
          padding: 10px 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--trans-fast);
          text-align: center;
        }

        .mood-tile:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .mood-tile.selected {
          background: var(--bg-elevated);
          border-color: var(--cyan-primary);
          color: var(--cyan-text);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
