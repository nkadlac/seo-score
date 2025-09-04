import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calculateScore, getScoreBand } from '../../src/utils/scoring';
import type { Branch, QuizSubmitPayload, QuizSubmitResponse, ResultSummary } from '../../src/types/quiz';
import { signResultToken, scoreToBucket } from '../../src/utils/resultToken';

// Map score to branch; keep aligned with scoring rules
const branchForScore = (score: number): Branch => {
  // Example: treat 70+ as strong potential → 100k offer
  return score >= 70 ? '100k_offer' : 'sub100k';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body as QuizSubmitPayload;
    if (!body?.quizId || !body?.email || !body?.answers) {
      return res.status(400).json({ error: 'Missing required fields: quizId, email, answers' });
    }

    // Calculate score and results
    const scored = calculateScore(body.answers);
    const branch = branchForScore(scored.score);

    // Build summary used for token (no PII)
  const summary: ResultSummary = {
      quizId: body.quizId,
      branch,
      score: scored.score,
      band: getScoreBand(scored.score),
      scoreBucket: scoreToBucket(scored.score),
      forecast: scored.forecast,
      topMoves: scored.topMoves.slice(0, 3)
    };

    const resultToken = signResultToken(summary);

    // Fire-and-forget integrations if secrets exist
    await Promise.allSettled([
      createCloseLeadSafe(body, scored, summary),
      subscribeKitSafe(body, scored, summary)
    ]);

    const response: QuizSubmitResponse = {
      resultToken,
      resultPath: `/r/${encodeURIComponent(resultToken)}`,
      branch
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('quiz/submit error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createCloseLeadSafe(body: QuizSubmitPayload, scored: ReturnType<typeof calculateScore>, summary: ResultSummary) {
  try {
    const apiKey = process.env.CLOSE_API_KEY?.trim();
    if (!apiKey) return;

    const auth = Buffer.from(apiKey + ':').toString('base64');
    const resp = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Pipeline 100: ${body.answers.businessName} (${body.answers.city})`,
        description: `Score: ${scored.score} | Band: ${scored.band}`,
        contacts: [{ name: body.answers.fullName, emails: [{ email: body.email, type: 'office' }] }],
        custom: {
          pipeline_score: scored.score,
          score_band: scored.band,
          branch: summary.branch,
          result_url: summary ? `/r/<server>` : '',
          quiz_id: summary.quizId,
          business_name: body.answers.businessName,
          domain: body.answers.businessData?.website?.replace(/^https?:\/\//, '') || '',
          city: body.answers.city,
          top_move_1: summary.topMoves[0],
          top_move_2: summary.topMoves[1],
          top_move_3: summary.topMoves[2],
          utm_source: body.utm?.utm_source,
          utm_medium: body.utm?.utm_medium,
          utm_campaign: body.utm?.utm_campaign,
          utm_content: body.utm?.utm_content,
          utm_term: body.utm?.utm_term,
          consent: !!body.consent,
        }
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('Close lead not created', resp.status, txt);
    }
  } catch (e) {
    console.warn('Close integration failed', e);
  }
}

async function subscribeKitSafe(body: QuizSubmitPayload, scored: ReturnType<typeof calculateScore>, summary: ResultSummary) {
  try {
    const apiKey = process.env.KIT_API_KEY;
    if (!apiKey) return;
    // Minimal Kit v4 subscribe-by-form as used elsewhere
    const resp = await fetch('https://api.kit.com/v4/forms/8480887/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': apiKey },
      body: JSON.stringify({
        email_address: body.email,
        first_name: body.answers.fullName?.split(' ')[0] ?? '',
        fields: {
          pipeline_score: scored.score,
          score_bucket: summary.scoreBucket,
          business_name: body.answers.businessName,
          city: body.answers.city,
          top_move_1: summary.topMoves[0],
          top_move_2: summary.topMoves[1],
          top_move_3: summary.topMoves[2],
          result_url: `/r/${encodeURIComponent(signResultToken(summary))}`,
        }
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('Kit subscribe failed', resp.status, txt);
    }
  } catch (e) {
    console.warn('Kit integration failed', e);
  }
}
