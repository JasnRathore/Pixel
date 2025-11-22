import { fetchQuizQuestions } from '../js/routerAI.js';
import { normalizeLevels, createQuizState } from '../js/questions.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const content = req.body;

    if (!content || !content.title) {
      return res.status(400).json({ error: 'Content data required' });
    }

    const raw = await fetchQuizQuestions(content);

    if (!raw) {
      console.error('❌ Quiz generator returned null');
      return res.status(500).json({ error: 'AI returned no quiz' });
    }

    const normalized = normalizeLevels(raw, content.title);

    if (
      !normalized ||
      !normalized.beginner ||
      !normalized.intermediate ||
      !normalized.master
    ) {
      console.error('❌ Normalization failed:', normalized);
      return res.status(500).json({ error: 'Normalization failed' });
    }

    const quizState = createQuizState(normalized);
    console.log('✅ FINAL QUIZ STATE SENT TO FRONTEND:', quizState);

    res.status(200).json(quizState);

  } catch (err) {
    console.error('❌ Quiz error:', err);
    res.status(500).json({ error: 'Quiz generation failed' });
  }
}
