import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const keys = [
    'DATAFORSEO_LOGIN',
    'DATAFORSEO_PASSWORD',
    'CLOSE_API_KEY',
    'KIT_API_KEY',
    'RESULTS_TOKEN_SECRET',
  ];

  const present: Record<string, boolean> = {};
  for (const k of keys) present[k] = Boolean(process.env[k]);

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    node: process.version,
    env: present,
    hint: 'Client keys must use VITE_ prefix and won\'t appear here.',
  });
}

