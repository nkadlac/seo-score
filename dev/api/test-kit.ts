import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({ error: 'Moved out of production. Use dev/api/test-kit.ts locally.' });
}

