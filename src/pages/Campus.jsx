// src/pages/Campus.jsx — Clean Studio Campus Assistant
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAI } from '../hooks/useAI';

const CAMPUS_SYSTEM = (profile) => `
You are LIAB's Campus Assistant for ${profile?.name || 'a student'} at ${profile?.university || 'their university'}.

Assist with:
- Study spaces and library availability
- Student support services
- Campus navigation & facilities

Be concise, practical, and clear. Format responses with clean Markdown.
`.trim();

const STUDY_SPACES = [
  { name: 'Main Library', floors: 'Floors 1-4', capacity: '800 Seats', features: ['Silent Zones', 'Group Rooms', 'PCs'], status: 'Open', occupancy: 65 },
  { name: 'Science Block Study Hub', floors: 'Ground Floor', capacity: '120 Seats', features: ['24hr Access', 'Whiteboards'], status: 'Open', occupancy: 40 },
  { name: 'Student Union Lounge', floors: 'Floor 1', capacity: '200 Seats', features: ['Café Area', 'Collaborative Tables'], status: 'Open', occupancy: 80 },
  { name: 'Faculty Reading Room', floors: 'Floor 2', capacity: '60 Seats', features: ['Silent Only', 'AC'], status: 'Open', occupancy: 30 },
  { name: 'Engineering Computer Lab', floors: 'Floor 3', capacity: '40 Seats', features: ['Workstations', 'Printers'], status: 'Closed', occupancy: 0 },
];

const QUICK_FAQS = [
  "Where are quietest study spaces on campus?",
  "What are the main library opening hours?",
  "What student academic support services are available?",
  "How can I book a group study room?",
];

export default function Campus() {
  const { profile } = useAuth();
  const { generate, loading: aiLoading } = useAI();
  const [tab, setTab] = useState('chat'); // chat | spaces | resources
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const sendChat = async (e) => {
    e?.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');
    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    const history = newMessages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    const reply = await generate(CAMPUS_SYSTEM(profile), msg, history.slice(0, -1));
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h2>Campus Guide</h2>
        <p>Campus AI assistant, real-time library occupancy & student resources</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          Ask Campus AI
        </button>
        <button className={`tab-btn ${tab === 'spaces' ? 'active' : ''}`} onClick={() => setTab('spaces')}>
          Study Spaces
        </button>
        <button className={`tab-btn ${tab === 'resources' ? 'active' : ''}`} onClick={() => setTab('resources')}>
          Student Resources
        </button>
      </div>

      {/* ── Tab: Chat ── */}
      {tab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div className="chat-container">
            <div className="chat-header">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>Campus AI Assistant</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {profile?.university || 'University Campus Services'}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Ask any question about campus facilities, study spaces, or student support.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {aiLoading && (
                <div className="chat-bubble ai">
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                </div>
              )}
            </div>

            <form className="chat-input-container" onSubmit={sendChat}>
              <input
                className="input"
                placeholder="Ask about campus spaces, resources, or advice..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ borderRadius: 'var(--radius-full)' }}
              />
              <button type="submit" className="btn btn-primary" disabled={aiLoading || !chatInput.trim()}>
                Send
              </button>
            </form>
          </div>

          {/* FAQ panel */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
              SUGGESTED QUESTIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_FAQS.map(q => (
                <button
                  key={q}
                  onClick={() => {
                    setChatInput(q);
                  }}
                  style={{
                    textAlign: 'left',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    transition: 'var(--trans-fast)'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Study Spaces ── */}
      {tab === 'spaces' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>LIVE OCCUPANCY STATUS</span>
            <span className="badge badge-success">UPDATED LIVE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STUDY_SPACES.map(s => (
              <div key={s.name} className="card card-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', color: '#FFF' }}>{s.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.floors} • Capacity: {s.capacity}
                    </div>
                  </div>
                  <span className={`badge ${s.status === 'Open' ? 'badge-success' : 'badge-danger'}`}>
                    {s.status}
                  </span>
                </div>

                {s.status === 'Open' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4, color: 'var(--text-secondary)' }}>
                      <span>Occupancy Rate</span>
                      <span>{s.occupancy}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                      <div className="progress-fill" style={{ width: `${s.occupancy}%` }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.features.map(f => (
                        <span key={f} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Student Resources ── */}
      {tab === 'resources' && (
        <div className="grid-2">
          {[
            { title: 'Student Counselling & Mental Health', desc: '24/7 mental health advice, confidential support, and appointment booking.' },
            { title: 'Academic Writing & Tutoring', desc: 'Help with research essays, thesis structure, and citation formatting.' },
            { title: 'Financial Aid & Emergency Bursaries', desc: 'Student grants, hardship funds, and financial advisory services.' },
            { title: 'Careers & Internship Desk', desc: 'CV reviews, mock interviews, and graduate placement programs.' },
          ].map(r => (
            <div key={r.title} className="card">
              <h3 style={{ fontSize: '0.95rem', marginBottom: 6, color: '#FFF' }}>{r.title}</h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 14 }}>{r.desc}</p>
              <button className="btn btn-secondary btn-sm">
                Access Resource →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
