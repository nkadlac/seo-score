import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const closeApiKey = process.env.CLOSE_API_KEY;
  
  if (!closeApiKey) {
    return res.status(500).json({ error: 'Close API key not found' });
  }

  try {
    const trimmedKey = closeApiKey.trim();
    const auth = Buffer.from(trimmedKey + ':').toString('base64');
    
    return res.status(200).json({
      raw_key_preview: closeApiKey.substring(0, 15) + '...',
      raw_key_length: closeApiKey.length,
      trimmed_key_preview: trimmedKey.substring(0, 15) + '...',
      trimmed_key_length: trimmedKey.length,
      auth_header: `Basic ${auth}`,
      auth_length: auth.length,
      btoa_test: Buffer.from('test:').toString('base64'),
      has_newline: closeApiKey !== trimmedKey,
      key_chars: Array.from(closeApiKey).map(c => c.charCodeAt(0))
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

