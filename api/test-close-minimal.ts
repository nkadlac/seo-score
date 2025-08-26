import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Minimal Close.com API test
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Close API key from environment (trim any whitespace)
    const closeApiKey = process.env.CLOSE_API_KEY?.trim();
    if (!closeApiKey) {
      return res.status(500).json({ error: 'Close API key not found' });
    }

    console.log('Testing minimal Close.com lead creation...');

    // Minimal Close.com lead creation
    const auth = btoa(closeApiKey + ':');
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

    const closeData = await closeResponse.json();

    if (!closeResponse.ok) {
      console.error('Close.com API error:', closeData);
      return res.status(closeResponse.status).json({
        error: 'Failed to create lead in Close.com',
        details: closeData
      });
    }

    console.log('Successfully created minimal Close.com lead:', closeData.id);

    return res.status(200).json({
      success: true,
      lead_id: closeData.id,
      message: 'Minimal lead created successfully'
    });

  } catch (error) {
    console.error('Close.com test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}