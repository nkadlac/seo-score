import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Test Kit.com API key validity
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const kitApiKey = process.env.KIT_API_KEY;
  const kitApiSecret = process.env.KIT_API_SECRET;
  
  if (!kitApiKey && !kitApiSecret) {
    return res.status(500).json({ error: 'Kit API credentials not found' });
  }

  console.log('Testing Kit API key:', kitApiKey?.substring(0, 8) + '...');
  console.log('Testing Kit API secret:', kitApiSecret?.substring(0, 8) + '...');

  try {
    // Test 1: Try v4 API to get account info
    console.log('Testing Kit v4 API...');
    const v4Response = await fetch('https://api.kit.com/v4/account', {
      method: 'GET',
      headers: {
        'X-Kit-Api-Key': kitApiKey,
      },
    });

    console.log('Kit v4 response status:', v4Response.status);
    
    if (v4Response.ok) {
      const v4Data = await v4Response.json();
      return res.status(200).json({
        success: true,
        version: 'v4',
        account: v4Data,
        message: 'Kit API key is valid for v4'
      });
    }

    // Test 2: Try v3 API with API Key
    console.log('Testing Kit v3 API with API Key...');
    const v3KeyResponse = await fetch(`https://api.convertkit.com/v3/account?api_key=${kitApiKey}`, {
      method: 'GET',
    });

    console.log('Kit v3 API Key response status:', v3KeyResponse.status);
    
    if (v3KeyResponse.ok) {
      const v3KeyData = await v3KeyResponse.json();
      return res.status(200).json({
        success: true,
        version: 'v3-key',
        account: v3KeyData,
        message: 'Kit API key is valid for v3'
      });
    }

    // Test 3: Try v3 API with API Secret
    console.log('Testing Kit v3 API with API Secret...');
    const v3Response = await fetch(`https://api.convertkit.com/v3/account?api_secret=${kitApiSecret}`, {
      method: 'GET',
    });

    console.log('Kit v3 response status:', v3Response.status);
    
    if (v3Response.ok) {
      const v3Data = await v3Response.json();
      return res.status(200).json({
        success: true,
        version: 'v3',
        account: v3Data,
        message: 'Kit API key is valid for v3'
      });
    }

    // All failed - return error details
    const v4Error = await v4Response.text();
    const v3KeyError = await v3KeyResponse.text();
    const v3SecretError = await v3Response.text();

    return res.status(400).json({
      error: 'Kit API authentication failed',
      v4_status: v4Response.status,
      v3_key_status: v3KeyResponse.status,
      v3_secret_status: v3Response.status,
      v4_error: v4Error,
      v3_key_error: v3KeyError,
      v3_secret_error: v3SecretError,
      api_key_preview: kitApiKey?.substring(0, 10) + '...',
      api_secret_preview: kitApiSecret?.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('Kit API test error:', error);
    return res.status(500).json({
      error: 'Kit API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}