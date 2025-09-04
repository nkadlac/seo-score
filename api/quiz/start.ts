import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import type { QuizStartResponse } from '../../src/types/quiz';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Generate a short quiz id; client persists UTMs locally
  const quizId = (`qz_` + crypto.randomBytes(4).toString('hex')) as QuizStartResponse['quizId'];

  return res.status(200).json({ quizId });
}

