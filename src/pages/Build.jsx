// src/pages/Build.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAI } from '../hooks/useAI';
import { useMemory } from '../hooks/useMemory';
import { saveCodeSession } from '../firebase/firestore';
import toast from 'react-hot-toast';

const DEBUG_SYSTEM = `
You are LIAB's Coding Coach.
Analyze the user's code/error cleanly:
1. Explain the problem simply (1-2 sentences)
2. Provide the fixed code snippet
3. Give 1 short practice question to test their understanding
Keep it clear and student-friendly. Use Markdown code blocks.
`.trim();

export default function Build() {
  const { user } = useAuth();
  const { generate, loading: aiLoading } = useAI();
  const { update: updateMemory } = useMemory();

  const [code, setCode] = useState('');
  const [errorInput, setErrorInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [tab, setTab] = useState('debug'); // debug | chat

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const analyzeCode = async () => {
    if (!code.trim() && !errorInput.trim()) return;
    const toastId = toast.loading('Analyzing code...');
    
    const prompt = `Code:\n\`\`\`\n${code}\n\`\`\`\nError Message:\n${errorInput}`;
    const res = await generate(DEBUG_SYSTEM, prompt);
    
    setAnalysis(res);
    toast.success('Done!', { id: toastId });

    if (user?.uid) {
      saveCodeSession(user.uid, { code, error: errorInput, response: res }).catch(() => {});
      updateMemory({ lastModule: 'build' }).catch(() => {});
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);

    const history = newMessages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    const reply = await generate('You are LIAB Code Assistant. Help students learn coding and fix bugs simply.', msg, history.slice(0, -1));
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h2>Coding Coach</h2>
        <p>Debug code errors, learn programming concepts & solve practice problems</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'debug' ? 'active' : ''}`} onClick={() => setTab('debug')}>
          Debug Code
        </button>
        <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          Ask Coding AI
        </button>
      </div>

      {tab === 'debug' && (
        <div className="grid-2">
          {/* Input Panel */}
          <div>
            <div className="input-group">
              <label>Your Code</label>
              <textarea
                className="input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', height: 240 }}
                placeholder="Paste your code snippet here..."
                value={code}
                onChange={e => setCode(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Error Message (Optional)</label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}
                placeholder="e.g. TypeError: Cannot read property 'map' of undefined"
                value={errorInput}
                onChange={e => setErrorInput(e.target.value)}
              />
            </div>

            <button
              className="btn btn-cyan btn-full"
              onClick={analyzeCode}
              disabled={aiLoading || (!code.trim() && !errorInput.trim())}
            >
              {aiLoading ? 'Analyzing Code...' : 'Fix My Code →'}
            </button>
          </div>

          {/* Output */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 360 }}>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-text)', fontWeight: 600, marginBottom: 12 }}>
              EXPLANATION & SOLUTION
            </div>

            {analysis ? (
              <div
                style={{ flex: 1, overflowY: 'auto', fontSize: '0.875rem', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{
                  __html: analysis
                    .replace(/\n/g, '<br/>')
                    .replace(/```([\s\S]*?)```/g, '<pre style="background:var(--bg-app);padding:12px;border-radius:6px;font-family:var(--font-mono);font-size:0.8rem;margin:8px 0;border:1px solid var(--border-default);overflow-x:auto;"><code>$1</code></pre>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FFF;">$1</strong>')
                }}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Paste your code on the left and click "Fix My Code" to see the explanation.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>Coding Assistant</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ask any programming question</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ask anything about Python, JavaScript, data structures, or web development.
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
              placeholder="Ask a coding question..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{ borderRadius: 'var(--radius-full)' }}
            />
            <button type="submit" className="btn btn-primary" disabled={aiLoading || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
