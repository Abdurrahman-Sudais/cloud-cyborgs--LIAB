// src/pages/StudyPlan.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAI } from '../hooks/useAI';
import { useMemory } from '../hooks/useMemory';
import { getNotes } from '../firebase/firestore';
import toast from 'react-hot-toast';

const PLANNER_SYSTEM = (profile, memory, savedNotes) => `
You are LIAB's Study Planner for ${profile?.name || 'a student'} studying ${profile?.course || 'their course'}.

Student's active documents:
${savedNotes.map(n => `- ${n.title}: ${n.summary ? n.summary.slice(0, 150) : 'No summary'}`).join('\n') || 'None'}

Student memory & goals:
- Recent topics: ${memory?.currentTopics?.join(', ') || 'General topics'}
- Study streak: ${memory?.studyStreak || 0} days

Generate a personalized 7-day study plan specifically structuring study time around their uploaded documents and goals.
Return ONLY valid JSON in this exact format:
{
  "weekSummary": "A concise overview of what this week focuses on.",
  "days": [
    {
      "day": "Monday",
      "date": "Day 1",
      "focus": "Topic or Document Name",
      "sessions": [
        { "time": "Morning", "task": "Actionable task linked to document or topic", "duration": "1.5 hours", "type": "study" }
      ],
      "tip": "Practical study advice for the day."
    }
  ],
  "priorities": ["Top Priority 1", "Top Priority 2", "Top Priority 3"]
}
Types allowed: "study" | "practice" | "review" | "rest" | "assignment"
`.trim();

export default function StudyPlan() {
  const { user, profile } = useAuth();
  const { generateJSON, loading: aiLoading } = useAI();
  const { memory, update: updateMemory } = useMemory();

  const [notes, setNotes] = useState([]);
  const [selectedNoteTitles, setSelectedNoteTitles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [customGoals, setCustomGoals] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getNotes(user.uid).then(n => {
      setNotes(n);
      if (n.length > 0) {
        setSelectedNoteTitles(n.map(doc => doc.title));
      }
    }).catch(() => {});
  }, [user]);

  const toggleNoteSelection = (title) => {
    setSelectedNoteTitles(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const generatePlan = async () => {
    setGenerating(true);
    const toastId = toast.loading('Generating study schedule...');

    const filteredNotes = notes.filter(n => selectedNoteTitles.includes(n.title));
    const extra = customGoals ? `\nAdditional user notes/goals: ${customGoals}` : '';

    const result = await generateJSON(
      PLANNER_SYSTEM(profile, memory, filteredNotes) + extra,
      'Generate 7-day study schedule now.'
    );

    if (result?.days) {
      setPlan(result);
      setShowForm(false);
      setActiveDay(0);
      updateMemory({ studyPlan: result.weekSummary }).catch(() => {});
      toast.success('Study plan created!', { id: toastId });
    } else {
      toast.error('Could not generate schedule. Try again.', { id: toastId });
    }
    setGenerating(false);
  };

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h2>Study Planner</h2>
        <p>Generate a 7-day schedule built directly from your uploaded notes and goals</p>
      </div>

      {showForm && (
        <div style={{ maxWidth: 720 }}>
          {/* Note Selector Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 6, color: '#FFF' }}>1. Include Uploaded Documents</h3>
            <p style={{ fontSize: '0.825rem', marginBottom: 14 }}>
              Select which saved lecture notes to structure your study week around:
            </p>

            {notes.length === 0 ? (
              <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                No uploaded documents found. You can upload PDFs in the <strong>Learn</strong> section first, or proceed below with custom goals.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {notes.map(n => {
                  const selected = selectedNoteTitles.includes(n.title);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleNoteSelection(n.title)}
                      className={`badge ${selected ? 'badge-cyan' : 'badge-muted'}`}
                      style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {selected ? '✓ ' : '+ '}{n.title}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>2. Additional Goals or Upcoming Exams</label>
              <textarea
                className="input"
                placeholder="e.g. Exam on Friday for Chemistry. Need 2 hours dedicated to practice questions."
                rows={3}
                value={customGoals}
                onChange={e => setCustomGoals(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-cyan btn-full btn-lg"
            onClick={generatePlan}
            disabled={generating || aiLoading}
          >
            {generating ? 'Generating Schedule...' : 'Generate 7-Day Plan →'}
          </button>
        </div>
      )}

      {/* Plan View */}
      {plan && !showForm && (
        <div>
          <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-text)', marginBottom: 4, fontWeight: 600 }}>
                WEEKLY SUMMARY
              </div>
              <p style={{ color: '#FFF', fontWeight: 500, fontSize: '0.925rem', margin: 0 }}>
                {plan.weekSummary}
              </p>
              {plan.priorities?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {plan.priorities.map((p, i) => (
                    <span key={i} className="badge badge-muted">Priority: {p}</span>
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
              Edit Plan
            </button>
          </div>

          {/* Days Switcher */}
          <div className="tab-bar">
            {plan.days.map((d, i) => (
              <button
                key={d.day}
                className={`tab-btn ${activeDay === i ? 'active' : ''}`}
                onClick={() => setActiveDay(i)}
              >
                {d.day} {d.day === today ? '(Today)' : ''}
              </button>
            ))}
          </div>

          {/* Active Day Detail */}
          {plan.days[activeDay] && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#FFF', fontSize: '1.05rem' }}>{plan.days[activeDay].day} Schedule</h3>
                <span className="badge badge-cyan">Focus: {plan.days[activeDay].focus}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {plan.days[activeDay].sessions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFF', marginBottom: 2 }}>
                        {s.task}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Time: {s.time} • Duration: {s.duration}
                      </div>
                    </div>
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
                      {s.type}
                    </span>
                  </div>
                ))}
              </div>

              {plan.days[activeDay].tip && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  <strong>Advice:</strong> {plan.days[activeDay].tip}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
