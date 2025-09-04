import crypto from 'crypto';
import type { ResultToken, ResultTokenPayload, ResultSummary } from '../types/quiz';

const getSecret = (): string => {
  // Dedicated secret preferred; fall back to other server secrets in dev only
  const secret = process.env.RESULTS_TOKEN_SECRET || process.env.CLOSE_API_KEY || '';
  if (!secret) {
    // In local dev, generate a stable ephemeral secret per process
    const g: any = globalThis as any;
    if (!g.__RESULTS_SECRET__) {
      g.__RESULTS_SECRET__ = crypto.randomBytes(16).toString('hex');
    }
    return 'dev-secret-' + g.__RESULTS_SECRET__;
  }
  return secret;
};

const base64url = (input: Buffer | string) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

export const signResultToken = (summary: ResultSummary): ResultToken => {
  const payload: ResultTokenPayload = { ...summary, v: 1 };
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest();
  const s = base64url(sig);
  return `${data}.${s}`;
};

export const verifyResultToken = (token: ResultToken): ResultSummary | null => {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const data = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', getSecret()).update(data).digest());
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    // Basic shape check
    if (!payload || typeof payload.score !== 'number' || !Array.isArray(payload.topMoves)) return null;
    const { v, ...summary } = payload;
    return summary as ResultSummary;
  } catch {
    return null;
  }
};

export const scoreToBucket = (score: number): string => {
  const floor = Math.max(0, Math.min(100, Math.floor(score / 10) * 10));
  const ceil = Math.min(100, floor + 9);
  return `${floor}-${ceil}`;
};
