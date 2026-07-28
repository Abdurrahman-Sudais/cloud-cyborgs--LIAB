// src/firebase/firestore.js
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from './config';

// ── Streak Logic ──────────────────────────────────────────────
export const updateStreak = async (uid) => {
  const memRef = doc(db, 'users', uid, 'meta', 'memory');
  const snap = await getDoc(memRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = new Date().toDateString();
  const last  = data.lastStudyDate;

  if (last === today) return; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newStreak = last === yesterday ? (data.studyStreak || 0) + 1 : 1;

  await updateDoc(memRef, {
    studyStreak: newStreak,
    lastStudyDate: today,
  });
  return newStreak;
};

// ── User Profile ──────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

// ── Memory ────────────────────────────────────────────────────
export const getMemory = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid, 'meta', 'memory'));
  return snap.exists() ? snap.data() : {};
};

export const updateMemory = async (uid, updates) => {
  await updateDoc(doc(db, 'users', uid, 'meta', 'memory'), updates);
};

export const addRecentActivity = async (uid, activity) => {
  await updateDoc(doc(db, 'users', uid, 'meta', 'memory'), {
    lastSession: serverTimestamp(),
    recentActivity: arrayUnion({ ...activity, timestamp: new Date().toISOString() }),
  });
};

// ── Notes ─────────────────────────────────────────────────────
export const addNote = async (uid, noteData) => {
  const ref = await addDoc(collection(db, 'users', uid, 'notes'), {
    ...noteData,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getNotes = async (uid) => {
  const q = query(collection(db, 'users', uid, 'notes'), orderBy('uploadedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getNote = async (uid, noteId) => {
  const snap = await getDoc(doc(db, 'users', uid, 'notes', noteId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateNote = async (uid, noteId, data) => {
  await updateDoc(doc(db, 'users', uid, 'notes', noteId), data);
};

// ── Quizzes ───────────────────────────────────────────────────
export const saveQuiz = async (uid, quizData) => {
  const ref = await addDoc(collection(db, 'users', uid, 'quizzes'), {
    ...quizData,
    createdAt: serverTimestamp(),
    score: null,
  });
  return ref.id;
};

export const getQuizzes = async (uid) => {
  const q = query(collection(db, 'users', uid, 'quizzes'), orderBy('createdAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateQuizScore = async (uid, quizId, score) => {
  await updateDoc(doc(db, 'users', uid, 'quizzes', quizId), { score });
};

// ── Flashcards ────────────────────────────────────────────────
export const saveFlashcards = async (uid, data) => {
  const ref = await addDoc(collection(db, 'users', uid, 'flashcards'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getFlashcardSets = async (uid) => {
  const q = query(collection(db, 'users', uid, 'flashcards'), orderBy('createdAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Code Sessions ─────────────────────────────────────────────
export const saveCodeSession = async (uid, data) => {
  const ref = await addDoc(collection(db, 'users', uid, 'codeSessions'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCodeSessions = async (uid) => {
  const q = query(collection(db, 'users', uid, 'codeSessions'), orderBy('createdAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Study Sessions ────────────────────────────────────────────
export const logStudySession = async (uid, data) => {
  await addDoc(collection(db, 'users', uid, 'sessions'), {
    ...data,
    timestamp: serverTimestamp(),
  });
};

export const getTodaySessions = async (uid) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const q = query(collection(db, 'users', uid, 'sessions'), orderBy('timestamp', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
