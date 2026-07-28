// src/pages/Learn.jsx
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../hooks/useAuth';
import { useAI } from '../hooks/useAI';
import { useMemory } from '../hooks/useMemory';
import { addNote, updateNote, saveQuiz, saveFlashcards, getNotes } from '../firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import toast from 'react-hot-toast';

// ── Client-side PDF text extraction using PDF.js ──────────────────
const extractTextFromPDF = async (file) => {
  try {
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
    }

    if (fullText.trim().length > 30) {
      return fullText;
    }
  } catch (err) {
    console.warn('PDF.js client extraction notice:', err);
  }

  // Fallback to text reader
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target.result || '';
      const printable = raw.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      resolve(printable.length > 50 ? printable.slice(0, 4000) : `Lecture Document: ${file.name}`);
    };
    reader.readAsText(file);
  });
};

const LEARN_SYSTEM = (profile, topic) => `
You are LIAB's Learn module — an expert academic tutor for ${profile?.name || 'a student'} studying ${profile?.course || 'their course'}.
Topic/note context: ${topic}
Be concise, clear, and direct. Format with markdown when helpful.
`.trim();

const QUIZ_SYSTEM = (topic) => `
You are a quiz generator. Generate exactly 5 multiple-choice questions based on this topic: ${topic}
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "q": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "A) Option 1",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
`.trim();

const FLASHCARD_SYSTEM = (topic) => `
You are a flashcard generator. Create 8 flashcards for this topic: ${topic}
Return ONLY valid JSON in this exact format:
{
  "cards": [
    { "front": "Term or question", "back": "Definition or answer" }
  ]
}
`.trim();

const SUMMARY_SYSTEM = (profile) => `
You are an academic summariser for ${profile?.name || 'a student'} studying ${profile?.course || 'their course'}.
Summarise the following lecture note cleanly:
1. Key Concepts (3-5 bullet points)
2. Core Definitions
3. Essential Takeaways
`.trim();

export default function Learn() {
  const { user, profile } = useAuth();
  const { generate, generateJSON, loading: aiLoading } = useAI();
  const { update: updateMemory } = useMemory();

  const [tab, setTab] = useState('upload'); // upload | notes | chat | quiz | flashcards
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [summary, setSummary] = useState('');
  const [processing, setProcessing] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Past notes
  const [pastNotes, setPastNotes] = useState([]);
  useEffect(() => {
    if (!user) return;
    getNotes(user.uid).then(setPastNotes);
  }, [user]);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizGenerating, setQuizGenerating] = useState(false);

  // Flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashGenerating, setFlashGenerating] = useState(false);

  // ── Fast Dropzone handler ──
  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    
    setProcessing(true);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
    setNoteTitle(cleanTitle);
    const toastId = toast.loading('Extracting & summarising document...');

    try {
      // 1. Fast parallel execution: Extract text immediately client-side
      const extractedText = await extractTextFromPDF(file);
      setNoteText(extractedText);

      // 2. Fire-and-forget storage upload in background (non-blocking)
      let fileUrl = '';
      if (user?.uid) {
        const storageRef = ref(storage, `users/${user.uid}/notes/${Date.now()}_${file.name}`);
        uploadBytes(storageRef, file).then(s => getDownloadURL(s.ref)).then(u => { fileUrl = u; }).catch(() => {});
      }

      // 3. Generate instant summary via Gemma AI
      const sum = await generate(
        SUMMARY_SYSTEM(profile),
        `Summarise this document (${cleanTitle}):\n\n${extractedText.slice(0, 3500)}`
      );

      setSummary(sum);

      // 4. Save to Firestore asynchronously
      if (user?.uid) {
        addNote(user.uid, {
          title: cleanTitle,
          fileName: file.name,
          fileUrl,
          textContent: extractedText.slice(0, 10000),
          summary: sum,
          status: 'ready',
        }).then(id => setCurrentNoteId(id)).catch(() => {});

        updateMemory({
          currentTopics: [cleanTitle],
          lastModule: 'learn',
        }).catch(() => {});
      }

      toast.success('Document ready', { id: toastId });
      setTab('chat');
    } catch (err) {
      console.error(err);
      toast.error('Extraction issue. Try pasting your text directly below.', { id: toastId });
    } finally {
      setProcessing(false);
    }
  }, [user, profile, generate, updateMemory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  // ── Chat ──
  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);

    const history = newMessages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    const context = `Document: ${noteTitle || 'general'}.\n${summary ? 'Summary:\n' + summary : ''}`;
    const reply = await generate(LEARN_SYSTEM(profile, context), userMsg, history.slice(0, -1));
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
  };

  // ── Quiz ──
  const generateQuiz = async () => {
    setQuizGenerating(true);
    setQuizSubmitted(false);
    setQuizAnswers({});
    const topic = noteTitle || 'the lecture material';
    const result = await generateJSON(QUIZ_SYSTEM(topic), `Generate 5 quiz questions for: ${topic}`);
    if (result?.questions) {
      setQuiz(result);
      if (user?.uid) {
        saveQuiz(user.uid, { topic, questions: result.questions, sourceNoteId: currentNoteId }).catch(() => {});
      }
      toast.success('Quiz ready');
    } else {
      toast.error('Could not generate quiz. Try again.');
    }
    setQuizGenerating(false);
    setTab('quiz');
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
    const correct = quiz.questions.filter((q, i) => quizAnswers[i] === q.answer).length;
    toast.success(`Score: ${correct}/${quiz.questions.length}`);
  };

  // ── Flashcards ──
  const generateFlashcards = async () => {
    setFlashGenerating(true);
    const topic = noteTitle || 'the lecture material';
    const result = await generateJSON(FLASHCARD_SYSTEM(topic), `Generate 8 flashcards for: ${topic}`);
    if (result?.cards) {
      setFlashcards(result.cards);
      setCardIndex(0);
      setFlipped(false);
      if (user?.uid) {
        saveFlashcards(user.uid, { topic, cards: result.cards, sourceNoteId: currentNoteId }).catch(() => {});
      }
      toast.success('Flashcards ready');
    } else {
      toast.error('Could not generate flashcards.');
    }
    setFlashGenerating(false);
    setTab('flashcards');
  };

  const TABS = [
    { id: 'upload', label: 'Upload' },
    { id: 'notes',  label: `My Notes${pastNotes.length ? ` (${pastNotes.length})` : ''}` },
    { id: 'chat', label: 'Assistant' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'flashcards', label: 'Flashcards' },
  ];

  return (
    <div className="page module-learn">
      <div className="page-header fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>Learn</h2>
            <p style={{ margin: 0 }}>Document Processing & Academic Assistant</p>
          </div>
          {(currentNoteId || noteTitle) && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={generateQuiz} disabled={quizGenerating || aiLoading}>
                {quizGenerating ? 'Generating...' : 'Generate Quiz'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={generateFlashcards} disabled={flashGenerating || aiLoading}>
                {flashGenerating ? 'Generating...' : 'Generate Flashcards'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="learn-tabs fade-in">
        {TABS.map(t => (
          <button key={t.id} className={`learn-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: My Notes ── */}
      {tab === 'notes' && (
        <div className="fade-in">
          {pastNotes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h3 style={{ marginBottom: 8 }}>No saved documents</h3>
              <p style={{ marginBottom: 20 }}>Upload a PDF or note to get started</p>
              <button className="btn btn-primary" onClick={() => setTab('upload')}>Upload Document →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastNotes.map(note => (
                <div key={note.id} className="card card-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => {
                    setNoteTitle(note.title);
                    setNoteText(note.textContent || '');
                    setSummary(note.summary || '');
                    setCurrentNoteId(note.id);
                    setTab('chat');
                    toast.success(`Loaded: ${note.title}`);
                  }}
                >
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, color: '#FFF' }}>{note.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {note.summary ? note.summary.slice(0, 90) + '...' : 'Saved document'}
                    </div>
                  </div>
                  <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>Load →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Upload ── */}
      {tab === 'upload' && (
        <div className="fade-in">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${processing ? 'processing' : ''}`}>
            <input {...getInputProps()} />
            {processing ? (
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 500 }}>Extracting & Summarising PDF...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 6 }}>Drop PDF or Lecture File</h3>
                <p style={{ marginBottom: 12, fontSize: '0.875rem' }}>or click to select from your device</p>
                <span className="badge badge-accent">PDF or Text files</span>
              </div>
            )}
          </div>

          {summary && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Summary — {noteTitle}</h3>
              <div className="summary-content" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- /gm, '• ') }} />
            </div>
          )}

          {/* Manual input */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Paste Raw Text</h3>
            <div className="input-group">
              <label>Document Title</label>
              <input className="input" placeholder="e.g. Organic Chemistry Lecture 1" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Content</label>
              <textarea className="input" placeholder="Paste your text content..." rows={5} value={noteText} onChange={e => setNoteText(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              disabled={!noteTitle || !noteText || processing}
              onClick={async () => {
                setProcessing(true);
                const toastId = toast.loading('Summarising...');
                const sum = await generate(SUMMARY_SYSTEM(profile), `Summarise:\n\n${noteTitle}\n\n${noteText}`);
                setSummary(sum);
                try {
                  const id = await addNote(user.uid, { title: noteTitle, textContent: noteText, summary: sum, status: 'ready' });
                  setCurrentNoteId(id);
                } catch (err) {}
                toast.success('Notes processed', { id: toastId });
                setTab('chat');
                setProcessing(false);
              }}
            >
              {processing ? 'Processing...' : 'Process Content →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Chat ── */}
      {tab === 'chat' && (
        <div className="fade-in">
          <div className="chat-container card">
            <div className="chat-header">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>LIAB Assistant</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {noteTitle ? `Context: ${noteTitle}` : 'General academic conversation'}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty">
                  <p>Ask questions regarding your uploaded material or coursework.</p>
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

            <form className="chat-input-row" onSubmit={sendChat}>
              <input
                className="input"
                placeholder="Ask LIAB a question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ borderRadius: 'var(--radius-full)', flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={aiLoading || !chatInput.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab: Quiz ── */}
      {tab === 'quiz' && (
        <div className="fade-in">
          {!quiz ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h3 style={{ marginBottom: 8 }}>No active quiz</h3>
              <p style={{ marginBottom: 20 }}>Generate a quiz from your document content</p>
              <button className="btn btn-primary" onClick={generateQuiz} disabled={quizGenerating}>
                {quizGenerating ? 'Generating...' : 'Generate Quiz Now →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Quiz — {noteTitle}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => { setQuiz(null); generateQuiz(); }}>
                  New Quiz
                </button>
              </div>
              {quiz.questions.map((q, i) => (
                <div key={i} className="card" style={{ marginBottom: 14, borderColor: quizSubmitted ? (quizAnswers[i] === q.answer ? 'var(--emerald)' : 'var(--rose)') : 'var(--border)' }}>
                  <p style={{ fontWeight: 600, marginBottom: 12, color: '#FFF' }}>
                    {i+1}. {q.q}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        className={`quiz-option ${quizAnswers[i] === opt ? 'selected' : ''} ${quizSubmitted && opt === q.answer ? 'correct' : ''} ${quizSubmitted && quizAnswers[i] === opt && opt !== q.answer ? 'wrong' : ''}`}
                        onClick={() => !quizSubmitted && setQuizAnswers(a => ({ ...a, [i]: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!quizSubmitted && (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ marginTop: 8 }}
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                >
                  Submit Answers
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Flashcards ── */}
      {tab === 'flashcards' && (
        <div className="fade-in">
          {flashcards.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h3 style={{ marginBottom: 8 }}>No active flashcards</h3>
              <p style={{ marginBottom: 20 }}>Generate a flashcard deck from your document</p>
              <button className="btn btn-primary" onClick={generateFlashcards} disabled={flashGenerating}>
                {flashGenerating ? 'Generating...' : 'Generate Deck Now →'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Flashcards — {noteTitle}</h3>
                <span className="badge badge-accent">{cardIndex + 1} / {flashcards.length}</span>
              </div>

              <div className="flashcard-wrap" onClick={() => setFlipped(f => !f)}>
                <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
                  <div className="flashcard-face flashcard-front">
                    <div className="flashcard-label">CARD {cardIndex + 1}</div>
                    <div className="flashcard-text">{flashcards[cardIndex]?.front}</div>
                  </div>
                  <div className="flashcard-face flashcard-back">
                    <div className="flashcard-label back">ANSWER</div>
                    <div className="flashcard-text">{flashcards[cardIndex]?.back}</div>
                  </div>
                </div>
              </div>

              <div className="progress-bar" style={{ marginTop: 20, marginBottom: 20 }}>
                <div className="progress-fill" style={{ width: `${((cardIndex + 1) / flashcards.length) * 100}%` }} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={cardIndex === 0}>
                  Previous
                </button>
                <button className="btn btn-primary" onClick={() => { setCardIndex(i => Math.min(flashcards.length - 1, i + 1)); setFlipped(false); }} disabled={cardIndex === flashcards.length - 1}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .learn-tabs {
          display: flex; gap: 4px; flex-wrap: wrap;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 4px;
          margin-bottom: 24px;
        }
        .learn-tab {
          flex: 1; padding: 8px 12px;
          background: none; border: none;
          font-family: var(--font); font-size: 0.825rem; font-weight: 500;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          cursor: pointer; transition: var(--trans);
          white-space: nowrap;
        }
        .learn-tab.active { background: var(--bg-elevated); color: var(--text-accent); font-weight: 600; border: 1px solid var(--border); }
        .learn-tab:not(.active):hover { color: var(--text-primary); }

        .dropzone {
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-lg);
          padding: 48px 32px;
          text-align: center;
          cursor: pointer;
          transition: var(--trans);
          background: var(--bg-surface);
        }
        .dropzone:hover, .dropzone.active {
          border-color: var(--accent);
          background: var(--bg-elevated);
        }
        .dropzone.processing { pointer-events: none; opacity: 0.7; }

        .chat-container { padding: 0; overflow: hidden; }
        .chat-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
        }
        .chat-messages {
          padding: 20px;
          min-height: 280px; max-height: 420px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 12px;
        }
        .chat-empty { text-align: center; padding: 40px 0; }
        .chat-empty p { font-size: 0.875rem; color: var(--text-muted); }
        .chat-input-row {
          display: flex; gap: 10px; padding: 14px 18px;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
        }

        /* Quiz */
        .quiz-option {
          width: 100%; padding: 10px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font); font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: left; cursor: pointer;
          transition: var(--trans);
        }
        .quiz-option:hover { border-color: var(--accent); color: var(--text-primary); }
        .quiz-option.selected { background: var(--accent-soft); border-color: var(--accent); color: var(--text-accent); font-weight: 600; }
        .quiz-option.correct { background: var(--emerald-soft) !important; border-color: var(--emerald) !important; color: var(--emerald) !important; font-weight: 600; }
        .quiz-option.wrong   { background: var(--rose-soft) !important; border-color: var(--rose) !important; color: var(--rose) !important; }

        /* Flashcard */
        .flashcard-wrap {
          perspective: 1000px;
          cursor: pointer;
          max-width: 520px;
          margin: 0 auto;
        }
        .flashcard {
          position: relative;
          height: 240px;
          transform-style: preserve-3d;
          transition: transform 0.5s ease;
        }
        .flashcard.flipped { transform: rotateY(180deg); }
        .flashcard-face {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          border-radius: var(--radius-lg);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px;
          border: 1px solid var(--border-strong);
        }
        .flashcard-front {
          background: var(--bg-card);
        }
        .flashcard-back {
          background: var(--bg-elevated);
          border-color: var(--accent);
          transform: rotateY(180deg);
        }
        .flashcard-label {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-muted);
          margin-bottom: 12px;
        }
        .flashcard-label.back { color: var(--text-accent); }
        .flashcard-text {
          font-size: 1rem; font-weight: 600;
          text-align: center; color: var(--text-primary);
          line-height: 1.5;
        }

        .summary-content {
          font-size: 0.875rem;
          line-height: 1.7;
          color: var(--text-secondary);
        }
        .summary-content strong { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
