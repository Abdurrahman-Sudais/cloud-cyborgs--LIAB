// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = async (email, password, profile) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(cred.user.uid, profile);
  return cred.user;
};

export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signInWithGoogle = async (profile = {}) => {
  const cred = await signInWithPopup(auth, googleProvider);
  const exists = await userProfileExists(cred.user.uid);
  if (!exists) {
    await createUserProfile(cred.user.uid, {
      name: cred.user.displayName || '',
      ...profile,
    });
  }
  return cred.user;
};

export const logOut = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

const userProfileExists = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists();
};

export const createUserProfile = async (uid, profile) => {
  await setDoc(doc(db, 'users', uid), {
    name: profile.name || '',
    university: profile.university || '',
    course: profile.course || '',
    year: profile.year || '',
    createdAt: serverTimestamp(),
  });

  // Initialise memory document
  await setDoc(doc(db, 'users', uid, 'meta', 'memory'), {
    lastSession: null,
    lastModule: null,
    currentTopics: [],
    pendingAssignments: [],
    studyStreak: 0,
    lastStudyDate: null,
    weakTopics: [],
    nextPlannedTopic: null,
    totalStudyMinutes: 0,
  });
};
