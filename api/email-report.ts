import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyResultToken } from '../src/utils/resultToken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, email } = req.body as { token: string; email: string };
    if (!token || !email) return res.status(400).json({ error: 'Missing token or email' });

    const summary = verifyResultToken(token);
    if (!summary) return res.status(400).json({ error: 'Invalid token' });

    const apiKey = process.env.KIT_API_KEY;
    if (!apiKey) {
      // If Kit is not configured, acknowledge request gracefully
      return res.status(200).json({ success: true, queued: false });
    }

    const resp = await fetch('https://api.kit.com/v4/forms/8480887/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': apiKey },
      body: JSON.stringify({
        email_address: email,
        fields: {
          pipeline_score: summary.score,
          score_bucket: summary.scoreBucket,
          top_move_1: summary.topMoves[0],
          top_move_2: summary.topMoves[1],
          top_move_3: summary.topMoves[2],
          result_url: `/r/${encodeURIComponent(token)}`,
        }
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('Kit email-report failed', resp.status, txt);
    }

    return res.status(200).json({ success: true, queued: true });
  } catch (e) {
    console.error('email-report error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

