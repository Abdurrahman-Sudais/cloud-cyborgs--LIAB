// src/hooks/useAI.jsx
// All Gemma calls go through this hook.
// Primary model: gemma-4-31b-it (Google AI Studio)

import { useState } from 'react';

const API_KEY = import.meta.env.VITE_GEMMA_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${API_KEY}`;

const buildRequest = (systemPrompt, userMessage, history = []) => ({
  system_instruction: { parts: [{ text: systemPrompt }] },
  contents: [
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ],
  generationConfig: { 
    temperature: 0.5, 
    maxOutputTokens: 1024,
  },
});

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (systemPrompt, userMessage, history = []) => {
    setLoading(true);
    setError(null);
    try {
      if (!API_KEY || API_KEY.startsWith('your_')) {
        throw new Error('API key is missing or not configured in .env.local');
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequest(systemPrompt, userMessage, history)),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.error?.message || `API error: ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const answerPart = parts.find(p => !p.thought) || parts[parts.length - 1] || {};
      return answerPart.text || '';
    } catch (err) {
      console.error('LIAB AI Call Error:', err);
      setError(err.message);
      return `[LIAB AI Note]: ${err.message}.`;
    } finally {
      setLoading(false);
    }
  };

  // Parse JSON from response (for quizzes, flashcards, study plans)
  const generateJSON = async (systemPrompt, userMessage) => {
    const raw = await generate(systemPrompt, userMessage);
    if (!raw || raw.startsWith('[LIAB AI Note]')) return null;
    
    // Clean up code fences, raw markdown & formatting
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Extract JSON object substring if model returns extra preamble text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('JSON parse retry...', cleaned);
      return null;
    }
  };

  return { generate, generateJSON, loading, error };
};
