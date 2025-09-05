import { DataForSEOServerService } from './lib/dataforseo-server';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { keywords, city } = req.body as { keywords: string[]; city: string };
    if (!Array.isArray(keywords) || !keywords.length || !city) {
      return res.status(400).json({ error: 'Missing keywords or city' });
    }

    const login = process.env.DATAFORSEO_LOGIN || '';
    const password = process.env.DATAFORSEO_PASSWORD || '';
    if (!login || !password) {
      return res.status(500).json({ error: 'DataForSEO not configured' });
    }

    const service = new DataForSEOServerService(login, password);
    const volumes = await service.getSearchVolumesForLocation(keywords, city);
    return res.status(200).json({ success: true, city, volumes });
  } catch (e) {
    console.error('seo-volumes error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

