// Vercel serverless function for SEO rankings
// This will be deployed to /api/seo-rankings

import { getDataForSEORankings } from '../src/api/dataforseo';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { keywords, businessPlaceId, city } = req.body;

    if (!keywords || !businessPlaceId || !city) {
      res.status(400).json({ error: 'Missing required parameters: keywords, businessPlaceId, city' });
      return;
    }

    console.log('SEO Rankings API called:', { keywords, businessPlaceId, city });

    // Get real SEO rankings from DataForSEO
    const rankings = await getDataForSEORankings(keywords, businessPlaceId, city);

    res.status(200).json({ 
      success: true, 
      rankings,
      totalKeywords: keywords.length,
      city
    });

  } catch (error) {
    console.error('SEO Rankings API error:', error);
    res.status(500).json({ 
      error: 'Failed to get SEO rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}