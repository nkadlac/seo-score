import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CloseWebhookPayload, QuizAnswers, ScoreResult } from '../src/types/quiz';

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
    const { answers, result, email }: {
      answers: QuizAnswers;
      result: ScoreResult;
      email: string;
    } = req.body;
    
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

    // Prepare contact for Close.com lead
    const contact = {
      name: answers.fullName,
      emails: [{ email, type: 'office' }],
      ...(answers.businessData?.phone && {
        phones: [{ phone: answers.businessData.phone, type: 'office' }]
      })
    };

    // Create lead in Close.com (Close uses Basic auth)
    const auth = btoa(closeApiKey + ':');
    const closeResponse = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Pipeline 100: ${answers.businessName} (${answers.city})`,
        description: `Score: ${result.score} | Band: ${result.band} | Services: ${answers.services.join(', ')}`,
        contacts: [contact],
        status_id: 'stat_1uXDXW5xheJavWF8ge89acFKdt6spmsce4uohwGL4iH', // Potential status
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

    // Add tags to the lead
    const tags = [
      'pipeline-100-lead',
      `score-${result.band}`,
      `services-${answers.services.join('-').toLowerCase()}`,
      `zone-${answers.radius}mi`,
      result.guaranteeStatus.includes('guarantee') ? 'guarantee-eligible' : 'baseline-service'
    ];
    
    if (tags && tags.length > 0) {
      try {
        await fetch(`https://api.close.com/api/v1/lead/${closeData.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags: tags
          }),
        });
      } catch (tagError) {
        console.warn('Failed to add tags to Close.com lead:', tagError);
        // Don't fail the whole request for tag errors
      }
    }

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