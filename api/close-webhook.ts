import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { QuizAnswers, ScoreResult } from '../src/types/quiz';

/**
 * Close.com CRM Integration
 * Creates leads in Close.com based on quiz results
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, result, email } = req.body as {
      answers: QuizAnswers;
      result: ScoreResult;
      email: string;
    };
    
    // Validate required fields
    if (!answers || !result || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: answers, result, email' 
      });
    }

    // Get Close API key from environment (trim any whitespace)
    const closeApiKey = process.env.CLOSE_API_KEY?.trim();
    if (!closeApiKey) {
      console.error('Close.com API key not configured');
      return res.status(500).json({ 
        error: 'Close.com integration not configured' 
      });
    }

    console.log('Creating Close.com lead for:', email);

    // Create lead in Close.com using the exact format that works
    const auth = Buffer.from(closeApiKey + ':').toString('base64');
    const closeResponse = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Pipeline 100: ${answers.businessName} (${answers.city})`,
        description: `Score: ${result.score} | Band: ${result.band} | Services: ${answers.services.join(', ')}`,
        contacts: [{
          name: answers.fullName,
          emails: [{ email, type: 'office' }]
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

    console.log('Successfully created Close.com lead:', closeData.id);

    // Add tags to the lead (if needed in future)
    // For now, skip tags to ensure basic functionality works

    return res.status(200).json({
      success: true,
      lead_id: closeData.id,
      message: 'Successfully created lead in Close.com'
    });

  } catch (error) {
    console.error('Close.com webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
