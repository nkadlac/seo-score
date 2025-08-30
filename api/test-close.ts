import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test Close.com API key validity
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const closeApiKey = process.env.CLOSE_API_KEY?.trim();
  
  if (!closeApiKey) {
    return res.status(500).json({ error: 'Close API key not found' });
  }

  console.log('Testing Close API key:', closeApiKey.substring(0, 15) + '...');

  try {
    // Test 1: Try Basic auth format (Close standard)
    console.log('Testing Close API with Basic auth...');
    const auth = Buffer.from(closeApiKey + ':').toString('base64');
    console.log('Auth header will be:', `Basic ${auth}`);
    const basicResponse = await fetch('https://api.close.com/api/v1/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Close Basic auth response status:', basicResponse.status);
    
    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      return res.status(200).json({
        success: true,
        auth_method: 'Basic',
        user: basicData,
        message: 'Close API key is valid with Basic auth'
      });
    }

    // Test 2: Try Bearer token format
    console.log('Testing Close API with Bearer token...');
    const bearerResponse = await fetch('https://api.close.com/api/v1/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${closeApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Close Bearer response status:', bearerResponse.status);
    
    if (bearerResponse.ok) {
      const bearerData = await bearerResponse.json();
      return res.status(200).json({
        success: true,
        auth_method: 'Bearer',
        user: bearerData,
        message: 'Close API key is valid with Bearer token'
      });
    }

    // Both failed - return error details
    const basicError = await basicResponse.text();
    const bearerError = await bearerResponse.text();

    return res.status(400).json({
      error: 'Close API key authentication failed',
      basic_status: basicResponse.status,
      bearer_status: bearerResponse.status,
      basic_error: basicError,
      bearer_error: bearerError
    });

  } catch (error) {
    console.error('Close API test error:', error);
    return res.status(500).json({
      error: 'Close API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
