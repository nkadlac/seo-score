import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const closeApiKey = process.env.CLOSE_API_KEY?.trim();
    if (!closeApiKey) {
      return res.status(500).json({ error: 'Close API key not found' });
    }

    const auth = Buffer.from(closeApiKey + ':').toString('base64');
    const closeResponse = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Pipeline 100 Test Lead',
        description: 'Minimal test lead creation',
        contacts: [{
          name: 'Test User',
          emails: [{ email: 'test@example.com', type: 'office' }]
        }]
      }),
    });

    const closeData: any = await closeResponse.json();

    if (!closeResponse.ok) {
      return res.status(closeResponse.status).json({ error: 'Failed', details: closeData });
    }

    return res.status(200).json({ success: true, lead_id: closeData.id });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

